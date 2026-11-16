import "server-only";
import { cookies } from "next/headers";
import { errorClass } from "@/lib/http/error";
import { adminOrigin } from "@/lib/admin/host";
import { createSessionValue, isIssuedAfter, SESSION_LIFETIME_MS, verifySessionValue } from "@/lib/admin/session-core";
import { getDb, isDatabaseConfigured } from "@/lib/db/client";
import { constantTimeEquals } from "@/lib/http/secret";

/*
  Auth for the private admin panel. There is one reader, so there are no accounts: the
  owner proves they hold the emailed one-time code (or, when email is not configured, the
  INBOX_SECRET recovery key) and gets a signed, expiring cookie.

  The session value is a signed `issuedAt.expiresAt` pair (lib/admin/session-core.ts), keyed
  by a key derived from INBOX_SECRET. Signing out records a revocation point
  (admin_session_state): any cookie issued before it stops working. Rotating INBOX_SECRET
  also invalidates every session at once.

  The cookie is host-only (no Domain attribute), so it exists on the admin host and the
  public site never carries it.
*/

// __Host- pins the cookie to this exact host over HTTPS with Path=/, so a sibling
// subdomain cannot plant or overwrite it. It needs Secure, which plain-http dev cannot do.
export const ADMIN_COOKIE = process.env.NODE_ENV === "production" ? "__Host-admin_session" : "admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_LIFETIME_MS / 1000;

/*
  Throttling caps guesses at a handful per window, but the real defence is a long random
  secret, so a short one is treated as no secret at all rather than trusted.
*/
export const MIN_SECRET_LENGTH = 32;

export type AdminSession = { expiresAt: Date };

function readSecret() {
  // Trimmed: a trailing newline from a pasted env value would otherwise make sign-in impossible.
  const secret = process.env.INBOX_SECRET?.trim();
  return secret && secret.length >= MIN_SECRET_LENGTH ? secret : null;
}

/** The key that keys the sign-in code hashes. Null when unset or too short. */
export function otpKey() {
  return readSecret();
}

export function isAdminConfigured() {
  return readSecret() !== null;
}

/** Constant-time comparison against INBOX_SECRET (the recovery key). */
export function checkSecret(candidate: string) {
  const secret = readSecret();
  if (!secret) return false;
  return constantTimeEquals(candidate, secret);
}

export function newSessionValue(now: number) {
  const secret = readSecret();
  if (!secret) throw new Error("INBOX_SECRET is not set.");
  return createSessionValue(secret, now);
}

/*
  The revocation point lives in the database. If it cannot be read (outage, migration 0005
  not applied yet) the signature and expiry alone decide, so the owner is never locked out
  of the health page during the outage they are diagnosing.
*/
async function revocationPoint() {
  try {
    const [row] = await getDb()<{ ms: number | null }[]>`
      select (extract(epoch from valid_after) * 1000)::float8 as ms from admin_session_state where id = 1
    `;
    return row?.ms ?? null;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const secret = readSecret();
  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!secret || !value) return null;

  const claims = verifySessionValue(secret, value, Date.now());
  if (!claims) return null;
  const validAfter = isDatabaseConfigured() ? await revocationPoint() : null;
  return isIssuedAfter(claims, validAfter) ? { expiresAt: new Date(claims.expiresAt) } : null;
}

export async function hasAdminSession() {
  return (await getAdminSession()) !== null;
}

/** Invalidates every session issued so far. Returns false when it could not be recorded. */
export async function revokeAllSessions() {
  if (!isDatabaseConfigured()) return false;
  try {
    await getDb()`
      insert into admin_session_state (id, valid_after) values (1, now())
      on conflict (id) do update set valid_after = excluded.valid_after
    `;
    return true;
  } catch (error) {
    console.error("[admin] revoking sessions failed", errorClass(error));
    return false;
  }
}

/**
 * CSRF check for the same-site admin forms: the browser must say the POST came from the
 * admin origin itself. `Sec-Fetch-Site` is compared first (only same-origin, or none for
 * address-bar style requests, pass); the Origin header must equal the admin origin, never
 * `request.url`, which outside Vercel carries whatever host the client chose. A missing
 * Origin is allowed (some clients omit it on same-origin form posts); "null" is not.
 */
export function isSameOriginOrUnspecified(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site !== null && site !== "same-origin" && site !== "none") return false;
  const origin = request.headers.get("origin");
  return origin === null || origin === adminOrigin();
}
