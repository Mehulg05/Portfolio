import "server-only";
import { adminHost } from "@/lib/admin/host";
import { otpKey } from "@/lib/admin/auth";
import {
  canIssueCode,
  OTP_REQUEST_WINDOW_SECONDS,
  OTP_TTL_SECONDS,
  buildCodeEmail,
  codeMatches,
  generateCode,
  hashCode,
  isRedeemable,
} from "@/lib/admin/otp-core";
import { profile } from "@/lib/content/profile";
import { getDb } from "@/lib/db/client";

/*
  Emailed one-time codes. The recipient is always CONTACT_TO_EMAIL (or the profile email),
  never anything the browser sent. Callers answer identically whether or not a code went
  out, so the response reveals nothing about throttling or delivery.
*/

const resendEndpoint = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 5000;
// Arbitrary constant naming the lock that serialises code issuing.
const ISSUE_LOCK_KEY = 7_340_211;

type CodeRow = { id: string; code_hash: string; expires_at: Date; attempts: number; used_at: Date | null };

export function isEmailSignInAvailable() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

async function deliver(code: string) {
  const to = process.env.CONTACT_TO_EMAIL || profile.email;
  try {
    const response = await fetch(resendEndpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(buildCodeEmail(code, to, adminHost)),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!response.ok) console.error(`[admin] Resend refused the sign-in code (${response.status}).`);
    return response.ok;
  } catch {
    console.error("[admin] sending the sign-in code failed");
    return false;
  }
}

/** Issues and emails a code unless the request limit is reached. Returns whether one was sent. */
export async function requestCode(): Promise<boolean> {
  const key = otpKey();
  if (!key || !isEmailSignInAvailable()) return false;
  const sql = getDb();

  const code = generateCode();
  const codeHash = hashCode(code, key);

  /*
    Count-then-insert is a race: seven clicks in one second all read "0 recent" before any
    insert lands. The advisory lock makes concurrent requests take turns, so each one sees
    the previous one's row. It is released when the transaction ends.
  */
  const issued = await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(${ISSUE_LOCK_KEY})`;
    const [recent] = await tx<{ count: number; since: number }[]>`
      select count(*)::int as count,
             coalesce(extract(epoch from now() - max(created_at)), 1e9)::float8 as since
      from admin_login_codes
      where created_at > now() - ${OTP_REQUEST_WINDOW_SECONDS}::int * interval '1 second'
    `;
    if (!recent || !canIssueCode(recent.count, recent.since)) return false;

    // A newer code replaces older ones: only the latest email is ever valid.
    await tx`update admin_login_codes set used_at = now() where used_at is null`;
    await tx`
      insert into admin_login_codes (expires_at, code_hash)
      values (now() + ${OTP_TTL_SECONDS}::int * interval '1 second', ${codeHash})
    `;
    return true;
  });
  if (!issued) return false;
  return deliver(code);
}

/** True once, for the right unexpired code. Wrong guesses burn the code's attempt budget. */
export async function redeemCode(candidate: string): Promise<boolean> {
  const key = otpKey();
  if (!key) return false;
  const sql = getDb();

  const rows = await sql<CodeRow[]>`
    select id, code_hash, expires_at, attempts, used_at from admin_login_codes
    where used_at is null order by created_at desc limit 1
  `;
  const row = rows[0];
  const stored = row && {
    codeHash: row.code_hash,
    expiresAt: row.expires_at,
    attempts: row.attempts,
    usedAt: row.used_at,
  };
  if (!row || !stored || !isRedeemable(stored, new Date())) return false;

  if (!codeMatches(candidate, row.code_hash, key)) {
    await sql`update admin_login_codes set attempts = attempts + 1 where id = ${row.id}`;
    return false;
  }
  // The conditional update makes redemption atomic: of two racing requests, one wins.
  const claimed = await sql`
    update admin_login_codes set used_at = now() where id = ${row.id} and used_at is null returning id
  `;
  return claimed.length === 1;
}

/** Deletes codes older than the given age. */
export async function pruneLoginCodes(olderThanSeconds: number): Promise<number> {
  const result = await getDb()`
    delete from admin_login_codes where created_at < now() - ${olderThanSeconds}::int * interval '1 second'
  `;
  return result.count;
}
