import "server-only";
import { pruneLoginAttempts } from "@/lib/admin/login-attempts";
import { pruneLoginCodes } from "@/lib/admin/otp";
import { notifyOwner } from "@/lib/contact/owner";
import { getDb } from "@/lib/db/client";
import { markNotified } from "@/lib/db/messages";
import { LOGIN_ATTEMPT_RETENTION_SECONDS } from "@/lib/db/retention";

/*
  Housekeeping shared by the daily cron and the "Retry notifications" button on /health.
*/

export const RETRY_LIMIT = 20;
// Resend's default rate limit is 2 requests a second; sends are paced just under it.
const SEND_SPACING_MS = 550;


export type RetryResult = { tried: number; sent: number; configured: boolean };

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/*
  Re-sends the email for messages whose notification never went out (Resend was down, the
  key was missing when they arrived). Oldest first, archived ones skipped: an archived
  message has been dealt with, so an email about it would only be noise.

  Two overlapping runs (the cron and a click) could both pick the same row and send it
  twice. That costs one duplicate email in a rare race, so there is no row claiming.
*/
export async function retryPendingNotifications(limit = RETRY_LIMIT): Promise<RetryResult> {
  // Without a key sendNotification is a no-op per row; skip the query and the loop entirely.
  if (!isResendConfigured()) return { tried: 0, sent: 0, configured: false };

  const rows = await getDb()<{ id: string; name: string; email: string; message: string }[]>`
    select id, name, email, message
    from messages
    where notified_at is null and status <> 'archived'
    order by created_at asc
    limit ${limit}
  `;

  let sent = 0;
  for (const [index, row] of rows.entries()) {
    if (index > 0) await wait(SEND_SPACING_MS);
    const ok = await notifyOwner({ name: row.name, email: row.email, message: row.message });
    if (!ok) continue;
    await markNotified(row.id);
    sent += 1;
  }
  return { tried: rows.length, sent, configured: true };
}

/** Sign-in throttling only looks back minutes; a day of rows is plenty of evidence to keep. */
export function pruneStaleLoginAttempts() {
  return Promise.all([
    pruneLoginAttempts(LOGIN_ATTEMPT_RETENTION_SECONDS),
    pruneLoginCodes(LOGIN_ATTEMPT_RETENTION_SECONDS),
  ]).then(([attempts, codes]) => attempts + codes);
}
