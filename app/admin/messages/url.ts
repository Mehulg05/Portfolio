import {
  type MessageView,
  isMessageView,
  isUuid,
  normaliseSearch,
} from "@/lib/db/messages";
import { isOneOf } from "@/lib/http/guards";

/*
  The page's whole state lives in the URL (?status, q, cursor, id), so every view is a link,
  reload-safe, and works without JavaScript. Everything read from the URL is narrowed here;
  nothing downstream sees a raw search param.
*/

export const notices = ["archived", "deleted", "unread"] as const;
export type Notice = (typeof notices)[number];

export type MessagesState = {
  status: MessageView;
  q: string;
  cursor: string | null;
  id: string | null;
};

export type MessagesUrl = MessagesState & {
  /** One-shot feedback set by the action route after a redirect. */
  notice: Notice | null;
  /** The message an "archived" notice can restore. */
  undo: string | null;
};

type RawParams = Record<string, string | string[] | undefined>;

const CURSOR_SHAPE = /^[A-Za-z0-9_-]{1,128}$/;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isNotice(value: unknown): value is Notice {
  return isOneOf(notices, value);
}

export function parseMessagesParams(params: RawParams): MessagesUrl {
  const status = first(params.status);
  const cursor = first(params.cursor);
  const id = first(params.id);
  const notice = first(params.notice);
  const undo = first(params.undo);

  return {
    status: isMessageView(status) ? status : "inbox",
    q: normaliseSearch(first(params.q)),
    // Only the shape is checked here; the data layer decodes and validates the contents.
    cursor: cursor && CURSOR_SHAPE.test(cursor) ? cursor : null,
    id: isUuid(id) ? id.toLowerCase() : null,
    notice: isNotice(notice) ? notice : null,
    undo: isUuid(undo) ? undo.toLowerCase() : null,
  };
}

/** A clean `/messages?...` link; defaults are left out so URLs stay short and canonical. */
export function messagesHref(state: Partial<MessagesUrl>) {
  const params = new URLSearchParams();
  if (state.status && state.status !== "inbox") params.set("status", state.status);
  if (state.q) params.set("q", state.q);
  if (state.cursor) params.set("cursor", state.cursor);
  if (state.id) params.set("id", state.id);
  if (state.notice) params.set("notice", state.notice);
  if (state.undo) params.set("undo", state.undo);
  const query = params.toString();
  return query ? `/messages?${query}` : "/messages";
}

const RETURN_BASE = "http://return.invalid";

/**
 * Turns a form's `return` field into a safe redirect target. Only a relative path to
 * /messages survives, and it is rebuilt from the allow-listed params rather than echoed,
 * so `//evil.example`, `/\evil.example`, `https://...` and stray params all collapse to a
 * plain `/messages` link on this host.
 */
export function safeReturnState(value: unknown): MessagesState {
  const fallback: MessagesState = { status: "inbox", q: "", cursor: null, id: null };
  if (typeof value !== "string" || value.length > 2048 || !value.startsWith("/messages")) return fallback;

  let url: URL;
  try {
    url = new URL(value, RETURN_BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== RETURN_BASE || url.pathname !== "/messages") return fallback;

  const { status, q, cursor, id } = parseMessagesParams(Object.fromEntries(url.searchParams));
  return { status, q, cursor, id };
}
