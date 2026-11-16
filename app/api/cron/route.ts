import { createHash, timingSafeEqual } from "node:crypto";
import { errorClass } from "@/lib/admin/health";
import { pruneStaleLoginAttempts, retryPendingNotifications } from "@/lib/admin/maintenance";
import { isDatabaseConfigured } from "@/lib/db/client";
import { pruneOldPageViews } from "@/lib/pulse/db";

/*
  The daily housekeeping run (vercel.json, 04:00 UTC). It lives outside /api/admin because
  Vercel calls the deployment on its own public domain, where proxy.ts hides admin APIs.
  The only credential is CRON_SECRET, which Vercel sends as a bearer token.
*/

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PAGE_VIEW_RETENTION_DAYS = 90;

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

// Hashed first so the comparison is constant-time and does not leak the secret's length.
function isAuthorised(header: string | null, secret: string) {
  return header !== null && timingSafeEqual(sha256(header), sha256(`Bearer ${secret}`));
}

type Task<T> = { ok: true; result: T } | { ok: false; error: string };

// Each task runs even if an earlier one failed; one bad table should not stop the rest.
async function run<T>(task: () => Promise<T>): Promise<Task<T>> {
  try {
    return { ok: true, result: await task() };
  } catch (error) {
    return { ok: false, error: errorClass(error) };
  }
}

export async function GET(request: Request) {
  // Compared untrimmed: Vercel sends the value exactly as stored.
  const secret = process.env.CRON_SECRET;
  if (!secret?.trim()) return Response.json({ ok: false, error: "CRON_SECRET is not set." }, { status: 503 });
  if (!isAuthorised(request.headers.get("authorization"), secret)) {
    return Response.json({ ok: false, error: "Unauthorised." }, { status: 401 });
  }
  if (!isDatabaseConfigured()) return Response.json({ ok: false, error: "DATABASE_URL is not set." }, { status: 503 });

  const pageViews = await run(() => pruneOldPageViews(PAGE_VIEW_RETENTION_DAYS));
  const loginAttempts = await run(pruneStaleLoginAttempts);
  const notifications = await run(() => retryPendingNotifications());

  const errors = Object.fromEntries(
    Object.entries({ pageViews, loginAttempts, notifications }).flatMap(([name, task]) =>
      task.ok ? [] : [[name, task.error]],
    ),
  );
  const ok = Object.keys(errors).length === 0;
  const body = {
    ok,
    pageViewsPruned: pageViews.ok ? pageViews.result : null,
    loginAttemptsPruned: loginAttempts.ok ? loginAttempts.result : null,
    notifications: notifications.ok ? notifications.result : null,
    ...(ok ? {} : { errors }),
  };
  if (!ok) console.error("[cron] housekeeping finished with errors", JSON.stringify(body));
  // A 500 makes a failed run visible in Vercel's cron log instead of a green tick.
  return Response.json(body, { status: ok ? 200 : 500 });
}
