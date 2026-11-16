import "server-only";
import { getDb } from "@/lib/db/client";

export const messageStatuses = ["new", "read", "replied", "archived"] as const;
export type MessageStatus = (typeof messageStatuses)[number];

/** What a list can be filtered to: one status, or "inbox" for everything not archived. */
export const messageViews = ["inbox", ...messageStatuses] as const;
export type MessageView = (typeof messageViews)[number];

export type Message = {
  id: string;
  createdAt: Date;
  name: string;
  email: string;
  message: string;
  status: MessageStatus;
  notifiedAt: Date | null;
  /** First time the message was read; kept through "mark unread" so medians stay honest. */
  readAt: Date | null;
  /** First time it was marked replied; kept the same way. */
  repliedAt: Date | null;
  /** Most recent archive. Only meaningful while status is "archived". */
  archivedAt: Date | null;
};

export type NewMessage = {
  name: string;
  email: string;
  message: string;
  ipHash: string;
  userAgent: string | null;
};

export type MessagePageQuery = {
  status?: MessageView;
  q?: string;
  /** Opaque value from a previous page's nextCursor. Anything malformed means "first page". */
  cursor?: string | null;
  limit?: number;
};

export type MessagePage = {
  items: Message[];
  nextCursor: string | null;
};

export type MessageCounts = Record<MessageStatus, number> & { inbox: number };

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Search terms past this length are cut; nobody types more, and ILIKE cost grows with it. */
export const MAX_SEARCH_LENGTH = 200;
const MAX_PAGE_SIZE = 500;

export function isMessageStatus(value: unknown): value is MessageStatus {
  return typeof value === "string" && (messageStatuses as readonly string[]).includes(value);
}

export function isMessageView(value: unknown): value is MessageView {
  return typeof value === "string" && (messageViews as readonly string[]).includes(value);
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export async function insertMessage(input: NewMessage) {
  const [row] = await getDb()<{ id: string }[]>`
    insert into messages (name, email, message, ip_hash, user_agent)
    values (${input.name}, ${input.email}, ${input.message}, ${input.ipHash}, ${input.userAgent})
    returning id
  `;
  if (!row) throw new Error("Insert returned no row.");
  return row.id;
}

export async function countRecentByIp(ipHash: string, windowSeconds: number) {
  const [row] = await getDb()<{ count: number }[]>`
    select count(*)::int as count from messages
    where ip_hash = ${ipHash}
      and created_at > now() - make_interval(secs => ${windowSeconds})
  `;
  return row?.count ?? 0;
}

// Matched case-insensitively so "A@x.com" and "a@x.com" share one window.
export async function countRecentByEmail(email: string, windowSeconds: number) {
  const [row] = await getDb()<{ count: number }[]>`
    select count(*)::int as count from messages
    where lower(email) = lower(${email})
      and created_at > now() - make_interval(secs => ${windowSeconds})
  `;
  return row?.count ?? 0;
}

export async function markNotified(id: string) {
  await getDb()`update messages set notified_at = now() where id = ${id}`;
}

function columns() {
  return getDb()`
    id, created_at as "createdAt", name, email, message, status,
    notified_at as "notifiedAt", read_at as "readAt", replied_at as "repliedAt",
    archived_at as "archivedAt"
  `;
}

/*
  Cursor = base64url("<created_at to the microsecond>|<id>"). The timestamp comes from SQL as
  text rather than from the JS Date, which only holds milliseconds: a millisecond-truncated
  cursor would sort before its own row and silently skip neighbours inside that millisecond.
*/
const CURSOR_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/;

function encodeCursor(time: string, id: string) {
  return Buffer.from(`${time}|${id}`, "utf8").toString("base64url");
}

function decodeCursor(cursor: string | null | undefined) {
  if (!cursor || cursor.length > 128 || !/^[A-Za-z0-9_-]+$/.test(cursor)) return null;
  const [time, id, ...rest] = Buffer.from(cursor, "base64url").toString("utf8").split("|");
  if (rest.length > 0 || !time || !id || !CURSOR_TIME_PATTERN.test(time) || !isUuid(id)) return null;
  // A well-shaped but impossible date (month 13, Feb 30) would make Postgres throw.
  const parsed = new Date(time);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 23) !== time.slice(0, 23)) return null;
  return { time, id: id.toLowerCase() };
}

/** Escapes LIKE metacharacters so the user's term matches literally (backslash is the escape). */
function likePattern(term: string) {
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export function normaliseSearch(q: unknown) {
  if (typeof q !== "string") return "";
  return q.trim().slice(0, MAX_SEARCH_LENGTH);
}

function searchClause(q: string) {
  const db = getDb();
  if (!q) return db``;
  const pattern = likePattern(q);
  return db`and (name ilike ${pattern} escape '\\' or email ilike ${pattern} escape '\\' or message ilike ${pattern} escape '\\')`;
}

function viewClause(view: MessageView) {
  const db = getDb();
  return view === "inbox" ? db`and status <> 'archived'` : db`and status = ${view}`;
}

type SortableRow = Message & { sortTime: string };

function withoutSortKey({ sortTime, ...message }: SortableRow): Message {
  void sortTime;
  return message;
}

/** Newest first, keyset-paginated on (created_at, id) so pages stay stable while rows arrive. */
export async function listMessagesPage({
  status = "inbox",
  q = "",
  cursor = null,
  limit = 50,
}: MessagePageQuery = {}): Promise<MessagePage> {
  const db = getDb();
  const size = Math.min(Math.max(Math.trunc(limit) || 1, 1), MAX_PAGE_SIZE);
  const after = decodeCursor(cursor);
  const search = normaliseSearch(q);

  const rows = await db<SortableRow[]>`
    select ${columns()},
      to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as "sortTime"
    from messages
    where true
      ${viewClause(status)}
      ${searchClause(search)}
      ${after ? db`and (created_at, id) < (${after.time}::timestamptz, ${after.id}::uuid)` : db``}
    order by created_at desc, id desc
    limit ${size + 1}
  `;

  const hasMore = rows.length > size;
  const page = rows.slice(0, size);
  const last = page.at(-1);
  return {
    items: page.map(withoutSortKey),
    nextCursor: hasMore && last ? encodeCursor(last.sortTime, last.id) : null,
  };
}

/** Per-status counts for the tabs, narrowed by the same search as the list when given. */
export async function countByStatus(q = ""): Promise<MessageCounts> {
  const rows = await getDb()<{ status: string; count: number }[]>`
    select status, count(*)::int as count
    from messages
    where true ${searchClause(normaliseSearch(q))}
    group by status
  `;
  const counts: MessageCounts = { inbox: 0, new: 0, read: 0, replied: 0, archived: 0 };
  for (const { status, count } of rows) {
    if (!isMessageStatus(status)) continue;
    counts[status] = count;
    if (status !== "archived") counts.inbox += count;
  }
  return counts;
}

export async function getMessage(id: string): Promise<Message | null> {
  if (!isUuid(id)) return null;
  const [row] = await getDb()<Message[]>`select ${columns()} from messages where id = ${id}`;
  return row ?? null;
}

/** @deprecated Unbounded by design; the panel uses listMessagesPage. */
export async function listMessages(limit = 200) {
  return getDb()<Message[]>`
    select ${columns()}
    from messages
    order by created_at desc
    limit ${limit}
  `;
}

/*
  read_at and replied_at record the first time, so "time to read/reply" survives a later
  "mark unread". Replying implies reading. archived_at is the latest archive.
  Returns false when no row has that id, so the route can answer 404.
*/
export async function setMessageStatus(id: string, status: MessageStatus) {
  if (!isUuid(id)) return false;
  const db = getDb();
  const stamps = {
    new: db``,
    read: db`, read_at = coalesce(read_at, now())`,
    replied: db`, read_at = coalesce(read_at, now()), replied_at = coalesce(replied_at, now())`,
    archived: db`, archived_at = now()`,
  }[status];
  const rows = await db`update messages set status = ${status} ${stamps} where id = ${id} returning id`;
  return rows.length > 0;
}

export async function deleteMessage(id: string) {
  if (!isUuid(id)) return false;
  const rows = await getDb()`delete from messages where id = ${id} returning id`;
  return rows.length > 0;
}
