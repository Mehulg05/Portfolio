import "server-only";
import { getDb } from "@/lib/db/client";
import { type MessageStatus, isMessageStatus } from "@/lib/db/messages";

/*
  Message numbers for the overview. Days are bucketed by UTC date so the chart agrees with
  the pulse charts and with the database's own notion of a day, whatever zone the page is
  read in. Status counts and medians are all-time: a personal inbox gets a handful of
  messages a month, and a 30-day median over two rows would be noise.
*/

export type MessageDay = { day: string; count: number };

export type RecentMessage = {
  id: string;
  name: string;
  /** First non-empty line of the body, trimmed; never more than ~120 characters. */
  firstLine: string;
  status: MessageStatus;
  createdAt: Date;
};

export type Median = { seconds: number | null; sample: number };

export type MessageStats = {
  days: number;
  /** Exactly `days` entries, oldest first, zero-filled; the last is today (UTC). */
  perDay: MessageDay[];
  /** Messages received inside the window. */
  inWindow: number;
  byStatus: Record<MessageStatus, number>;
  toRead: Median;
  toReply: Median;
  newest: RecentMessage[];
};

const FIRST_LINE_MAX = 120;

function toNumberOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function firstLine(body: string) {
  const line = body.split(/\r?\n/).find((l) => l.trim() !== "")?.trim() ?? "";
  return line.length > FIRST_LINE_MAX ? `${line.slice(0, FIRST_LINE_MAX - 1).trimEnd()}…` : line;
}

async function perDay(days: number) {
  // generate_series supplies the empty days, so the chart always has `days` slots.
  return getDb()<MessageDay[]>`
    with series as (
      select (now() at time zone 'utc')::date - g.i as day
      from generate_series(0, ${days - 1}::int) as g(i)
    )
    select to_char(series.day, 'YYYY-MM-DD') as day, count(m.id)::int as count
    from series
    left join messages m on (m.created_at at time zone 'utc')::date = series.day
    group by series.day
    order by series.day
  `;
}

async function statusCounts() {
  const rows = await getDb()<{ status: string; count: number }[]>`
    select status, count(*)::int as count from messages group by status
  `;
  const counts: Record<MessageStatus, number> = { new: 0, read: 0, replied: 0, archived: 0 };
  for (const row of rows) if (isMessageStatus(row.status)) counts[row.status] = row.count;
  return counts;
}

async function medians() {
  // greatest(0, ...) because a clock skew between writers must not produce a negative wait.
  const [row] = await getDb()<
    { toRead: unknown; readSample: number; toReply: unknown; replySample: number }[]
  >`
    select
      percentile_cont(0.5) within group (order by greatest(0, extract(epoch from read_at - created_at))::float8)
        filter (where read_at is not null) as "toRead",
      count(*) filter (where read_at is not null)::int as "readSample",
      percentile_cont(0.5) within group (order by greatest(0, extract(epoch from replied_at - created_at))::float8)
        filter (where replied_at is not null) as "toReply",
      count(*) filter (where replied_at is not null)::int as "replySample"
    from messages
  `;
  return {
    toRead: { seconds: toNumberOrNull(row?.toRead), sample: row?.readSample ?? 0 },
    toReply: { seconds: toNumberOrNull(row?.toReply), sample: row?.replySample ?? 0 },
  };
}

async function newest(limit: number) {
  // left() keeps a long message body out of the overview query; only its first line is shown.
  const rows = await getDb()<{ id: string; name: string; body: string; status: string; createdAt: Date }[]>`
    select id, name, left(message, 400) as body, status, created_at as "createdAt"
    from messages
    order by created_at desc
    limit ${limit}
  `;
  return rows.map(
    (row): RecentMessage => ({
      id: row.id,
      name: row.name,
      firstLine: firstLine(row.body),
      status: isMessageStatus(row.status) ? row.status : "new",
      createdAt: row.createdAt,
    }),
  );
}

export async function getMessageStats(days = 30): Promise<MessageStats> {
  const window = Math.max(1, Math.min(365, Math.floor(days)));
  const [daily, byStatus, waits, recent] = await Promise.all([perDay(window), statusCounts(), medians(), newest(3)]);
  return {
    days: window,
    perDay: daily,
    inWindow: daily.reduce((sum, d) => sum + d.count, 0),
    byStatus,
    ...waits,
    newest: recent,
  };
}
