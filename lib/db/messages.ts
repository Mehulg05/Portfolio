import "server-only";
import { getDb } from "@/lib/db/client";
import {
  type MessageStatus,
  type MessageView,
  MAX_PAGE_SIZE,
  decodeCursor,
  encodeCursor,
  isMessageStatus,
  isUuid,
  likePattern,
  normaliseSearch,
} from "@/lib/db/messages-model";

export {
  type MessageStatus,
  type MessageView,
  MAX_SEARCH_LENGTH,
  isMessageStatus,
  isMessageView,
  isUuid,
  messageStatuses,
  messageViews,
  normaliseSearch,
} from "@/lib/db/messages-model";

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

export type SubmissionLimits = {
  ipHour: number;
  ipDay: number;
  emailDay: number;
  /** Across every sender: the form must not be usable to fill the shared database or the mail quota. */
  globalHour: number;
  globalDay: number;
};

export type InsertResult = { ok: true; id: string } | { ok: false; retryAfterSeconds: number };

const HOUR = 60 * 60;
const DAY = 24 * HOUR;
// Arbitrary constant naming the lock that serialises contact submissions.
const SUBMIT_LOCK_KEY = 7_340_212;

/*
  Checks every window and inserts in one transaction under an advisory lock, so concurrent
  submissions take turns and each sees the previous row: the limits are exact, not
  best-effort. The form gets a few messages a week, so the lock is never contended in practice.
  A full window answers with its own length as Retry-After (an upper bound, not the moment
  the oldest row ages out); the answer is identical for per-sender and global limits.
*/
export async function insertMessageWithinLimits(input: NewMessage, limits: SubmissionLimits): Promise<InsertResult> {
  return getDb().begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(${SUBMIT_LOCK_KEY})`;
    const [use] = await tx<
      { ipHour: number; ipDay: number; emailDay: number; globalHour: number; globalDay: number }[]
    >`
      select
        count(*) filter (where ip_hash = ${input.ipHash} and created_at > now() - ${HOUR}::int * interval '1 second')::int as "ipHour",
        count(*) filter (where ip_hash = ${input.ipHash})::int as "ipDay",
        count(*) filter (where lower(email) = lower(${input.email}))::int as "emailDay",
        count(*) filter (where created_at > now() - ${HOUR}::int * interval '1 second')::int as "globalHour",
        count(*)::int as "globalDay"
      from messages
      where created_at > now() - ${DAY}::int * interval '1 second'
    `;
    if (use) {
      if (use.ipHour >= limits.ipHour || use.globalHour >= limits.globalHour) return { ok: false, retryAfterSeconds: HOUR };
      if (use.ipDay >= limits.ipDay || use.emailDay >= limits.emailDay || use.globalDay >= limits.globalDay) {
        return { ok: false, retryAfterSeconds: DAY };
      }
    }
    const [row] = await tx<{ id: string }[]>`
      insert into messages (name, email, message, ip_hash, user_agent)
      values (${input.name}, ${input.email}, ${input.message}, ${input.ipHash}, ${input.userAgent})
      returning id
    `;
    if (!row) throw new Error("Insert returned no row.");
    return { ok: true, id: row.id } as const;
  }) as Promise<InsertResult>;
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
