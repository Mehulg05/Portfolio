/*
  The pure half of lib/db/messages.ts: statuses, id and search-term guards, and the keyset
  cursor codec. Free of server-only code, so `npm test` can import it.
*/
import { isOneOf } from "@/lib/http/guards";

export const messageStatuses = ["new", "read", "replied", "archived"] as const;
export type MessageStatus = (typeof messageStatuses)[number];

/** What a list can be filtered to: one status, or "inbox" for everything not archived. */
export const messageViews = ["inbox", ...messageStatuses] as const;
export type MessageView = (typeof messageViews)[number];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Search terms past this length are cut; nobody types more, and ILIKE cost grows with it. */
export const MAX_SEARCH_LENGTH = 200;
export const MAX_PAGE_SIZE = 500;

export function isMessageStatus(value: unknown): value is MessageStatus {
  return isOneOf(messageStatuses, value);
}

export function isMessageView(value: unknown): value is MessageView {
  return isOneOf(messageViews, value);
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

/*
  Cursor = base64url("<created_at to the microsecond>|<id>"). The timestamp comes from SQL as
  text rather than from the JS Date, which only holds milliseconds: a millisecond-truncated
  cursor would sort before its own row and silently skip neighbours inside that millisecond.
*/
const CURSOR_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;

export function encodeCursor(time: string, id: string) {
  return Buffer.from(`${time}|${id}`, "utf8").toString("base64url");
}

export function decodeCursor(cursor: string | null | undefined) {
  if (!cursor || cursor.length > 128 || !/^[A-Za-z0-9_-]+$/.test(cursor)) return null;
  const [time, id, ...rest] = Buffer.from(cursor, "base64url").toString("utf8").split("|");
  if (rest.length > 0 || !time || !id || !CURSOR_TIME_PATTERN.test(time) || !isUuid(id)) return null;
  // A well-shaped but impossible date (month 13, Feb 30) would make Postgres throw.
  const parsed = new Date(time);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 23) !== time.slice(0, 23)) return null;
  return { time, id: id.toLowerCase() };
}

/** Escapes LIKE metacharacters so the user's term matches literally (backslash is the escape). */
export function likePattern(term: string) {
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export function normaliseSearch(q: unknown) {
  if (typeof q !== "string") return "";
  return q.trim().slice(0, MAX_SEARCH_LENGTH);
}

