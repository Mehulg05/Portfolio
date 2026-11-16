import { type MessagesUrl, messagesHref, safeReturnState } from "@/app/admin/messages/url";
import { hasAdminSession, isSameOriginOrUnspecified } from "@/lib/admin/auth";
import { isDatabaseConfigured } from "@/lib/db/client";
import { type MessageStatus, deleteMessage, isMessageStatus, isUuid, setMessageStatus } from "@/lib/db/messages";
import { errorClass } from "@/lib/admin/health";

// postgres.js needs TCP sockets, and the session check needs node:crypto.
export const runtime = "nodejs";

function text(body: string, status: number) {
  return new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
}

async function readForm(request: Request) {
  try {
    return await request.formData();
  } catch {
    return null;
  }
}

type Action = { kind: "status"; status: MessageStatus } | { kind: "delete" };

function readAction(form: FormData | null): Action | null {
  if (!form) return null;
  const intent = form.get("intent");
  if (intent !== null) return intent === "delete" ? { kind: "delete" } : null;
  const status = form.get("status");
  return isMessageStatus(status) ? { kind: "status", status } : null;
}

/*
  Targeted by plain HTML forms on /messages, so triage works with JavaScript off. Answers
  with a 303 to the view the form came from (its `return` field, sanitised), plus a
  one-shot notice the page can show.

  Mutations: `status=new|read|replied|archived` or `intent=delete`.
*/
export async function POST(request: Request, { params }: RouteContext<"/api/admin/messages/[id]">) {
  if (!isSameOriginOrUnspecified(request)) return text("Forbidden", 403);
  if (!(await hasAdminSession())) return text("Sign in first.", 401);
  if (!isDatabaseConfigured()) return text("DATABASE_URL is not set.", 503);

  const { id: rawId } = await params;
  // Checked before the query because Postgres throws on a malformed uuid instead of matching nothing.
  if (!isUuid(rawId)) return text("No such message.", 404);
  const id = rawId.toLowerCase();

  const form = await readForm(request);
  const action = readAction(form);
  if (!action) return text("Send status=new|read|replied|archived or intent=delete.", 400);

  let found: boolean;
  try {
    found = action.kind === "delete" ? await deleteMessage(id) : await setMessageStatus(id, action.status);
  } catch (error) {
    console.error("[messages] action failed", action.kind, errorClass(error));
    return text("Could not update the message.", 500);
  }
  if (!found) return text("No such message.", 404);

  const back: MessagesUrl = { ...safeReturnState(form?.get("return")), notice: null, undo: null };
  if (action.kind === "delete") {
    // The row is gone, so the detail pane would only show "not found".
    if (back.id === id) back.id = null;
    back.notice = "deleted";
  } else if (action.status === "archived") {
    back.notice = "archived";
    back.undo = id;
  } else if (action.status === "new") {
    // Tells the page not to auto-mark the message read again the moment it re-renders.
    back.notice = "unread";
  }

  // A relative Location resolves against the admin URL the browser posted to; request.url
  // can carry the public or an internal origin behind the host rewrite.
  return new Response(null, { status: 303, headers: { Location: messagesHref(back) } });
}
