import { hasAdminSession, isSameOriginOrUnspecified } from "@/lib/admin/auth";
import { errorClass } from "@/lib/admin/health";
import { retryPendingNotifications } from "@/lib/admin/maintenance";
import { isDatabaseConfigured } from "@/lib/db/client";

// postgres.js needs TCP sockets, and the session check needs node:crypto.
export const runtime = "nodejs";
// Twenty sends paced for Resend's rate limit take about eleven seconds.
export const maxDuration = 30;

function text(body: string, status: number) {
  return new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
}

/*
  Posted by the plain form on /health, so it works without JavaScript; answers with a 303
  back to the page, which reads the outcome from ?retried=<sent>/<tried>.
*/
export async function POST(request: Request) {
  if (!isSameOriginOrUnspecified(request)) return text("Forbidden", 403);
  if (!(await hasAdminSession())) return text("Sign in first.", 401);
  if (!isDatabaseConfigured()) return text("DATABASE_URL is not set.", 503);

  let outcome: string;
  try {
    const { tried, sent } = await retryPendingNotifications();
    outcome = `${sent}/${tried}`;
  } catch (error) {
    console.error(`[health] notification retry failed: ${errorClass(error)}`);
    outcome = "error";
  }
  // A relative Location: request.url can carry the internal origin rather than the admin host.
  return new Response(null, { status: 303, headers: { Location: `/health?retried=${outcome}` } });
}
