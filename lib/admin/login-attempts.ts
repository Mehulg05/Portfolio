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

/*
  Above this many failures across all sources in one window, further failures are not
  stored. The per-source lockout already bounds one client; this bounds a spread-out flood,
  so the table cannot be grown without limit by an unauthenticated caller.
*/
export const GLOBAL_FAILURE_CEILING = 300;

export type FailureCounts = { source: number; global: number };

/**
 * Failures from this ip_hash inside the window, counted only since its last success (the
 * owner fat-fingering the secret twice should not carry those strikes into the next
 * session), plus the failures from everyone in the same window.
 */
export async function countRecentFailures(ipHash: string, windowSeconds: number): Promise<FailureCounts> {
  const [row] = await getDb()<FailureCounts[]>`
    select
      (select count(*)::int from login_attempts
        where ip_hash = ${ipHash}
          and succeeded = false
          and created_at > now() - ${windowSeconds}::int * interval '1 second'
          and created_at > coalesce(
            (select max(created_at) from login_attempts where ip_hash = ${ipHash} and succeeded),
            '-infinity'::timestamptz
          )) as source,
      (select count(*)::int from login_attempts
        where succeeded = false
          and created_at > now() - ${windowSeconds}::int * interval '1 second') as global
  `;
  return { source: row?.source ?? 0, global: row?.global ?? 0 };
}

/** Deletes attempts older than the given age; returns how many rows went. */
export async function pruneLoginAttempts(olderThanSeconds: number): Promise<number> {
  const result = await getDb()`
    delete from login_attempts
    where created_at < now() - ${olderThanSeconds}::int * interval '1 second'
  `;
  return result.count;
}
