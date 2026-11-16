import "server-only";
import { getDb } from "@/lib/db/client";

/*
  Sign-in throttling, keyed by the hashed client IP. Every attempt is a row; the limit is a
  count of recent failures. Rows hold no secret material and no raw IP, only the HMAC from
  lib/contact/abuse.ts and whether the attempt worked.
*/

export { LOGIN_FAILURE_LIMIT, LOGIN_WINDOW_SECONDS } from "@/lib/admin/otp-core";

export async function recordLoginAttempt(ipHash: string, succeeded: boolean): Promise<void> {
  await getDb()`insert into login_attempts (ip_hash, succeeded) values (${ipHash}, ${succeeded})`;
}

/**
 * Failures from this ip_hash inside the window, counted only since its last success: the
 * owner fat-fingering the secret twice before signing in should not carry those two
 * strikes into their next session.
 */
export async function countRecentFailures(ipHash: string, windowSeconds: number): Promise<number> {
  const rows = await getDb()<{ count: number }[]>`
    select count(*)::int as count
    from login_attempts
    where ip_hash = ${ipHash}
      and succeeded = false
      and created_at > now() - ${windowSeconds}::int * interval '1 second'
      and created_at > coalesce(
        (select max(created_at) from login_attempts where ip_hash = ${ipHash} and succeeded),
        '-infinity'::timestamptz
      )
  `;
  return rows[0]?.count ?? 0;
}

/** Deletes attempts older than the given age; returns how many rows went. */
export async function pruneLoginAttempts(olderThanSeconds: number): Promise<number> {
  const result = await getDb()`
    delete from login_attempts
    where created_at < now() - ${olderThanSeconds}::int * interval '1 second'
  `;
  return result.count;
}
