import { NextResponse } from "next/server";
import { hasInboxSession, isSameOrigin } from "@/lib/contact/inbox-auth";
import { isDatabaseConfigured } from "@/lib/db/client";
import { isMessageStatus, setMessageStatus } from "@/lib/db/messages";

// postgres.js needs TCP sockets, and the session check needs node:crypto.
export const runtime = "nodejs";

// Checked before the query because Postgres throws on a malformed uuid instead of matching nothing.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(body: string, status: number) {
  return new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
}

/*
  Targeted by plain HTML forms on /inbox, so marking a message works with JavaScript off
  and the page needs no client components. Answers with a 303 back to the card that was
  acted on.
*/
export async function POST(request: Request, { params }: RouteContext<"/api/inbox/messages/[id]">) {
  if (!isSameOrigin(request)) return text("Forbidden", 403);
  if (!(await hasInboxSession())) return text("Sign in at /inbox first.", 401);
  if (!isDatabaseConfigured()) return text("DATABASE_URL is not set.", 503);

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return text("No such message.", 404);

  let status: FormDataEntryValue | null = null;
  try {
    status = (await request.formData()).get("status");
  } catch {
    // Not a form body; falls through to the 400 below.
  }
  if (!isMessageStatus(status)) return text("Status must be new, read or replied.", 400);

  let updated: boolean;
  try {
    updated = await setMessageStatus(id, status);
  } catch (error) {
    console.error("[inbox] status update failed", error);
    return text("Could not update the message.", 500);
  }
  if (!updated) return text("No such message.", 404);

  return NextResponse.redirect(new URL(`/inbox#m-${id.toLowerCase()}`, request.url), 303);
}
