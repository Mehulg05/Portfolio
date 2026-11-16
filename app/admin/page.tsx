import Link from "next/link";
import { BarStrip } from "@/app/admin/_charts/BarStrip";
import { formatCount, formatDuration, formatLongDay, formatPercent, plural } from "@/app/admin/_charts/format";
import { PageHeader, Panel, Stat, StatGrid, monoLabel } from "@/app/admin/_charts/Panel";
import { formatAbsoluteTime, formatRelativeTime } from "@/app/admin/_ui/relative-time";
import { hasAdminSession } from "@/lib/admin/auth";
import { errorClass } from "@/lib/admin/health";
import { getMessageStats, type Median, type MessageStats, type RecentMessage } from "@/lib/admin/stats";
import { getPulseStats, type PulseStats } from "@/lib/pulse/stats";

// Reads a cookie and live rows on every request; nothing here may be cached or prerendered.
export const dynamic = "force-dynamic";

// No title of its own: this page shares the layout segment, where a title template does not
// apply, so the layout default "(N) Admin" is the right name for the landing page.

const WINDOW_DAYS = 30;
const PULSE_DAYS = 7;

async function settle<T>(label: string, load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    console.error(`[overview] ${label} failed: ${errorClass(error)}`);
    return null;
  }
}

function LoadError({ what }: { what: string }) {
  return (
    <p role="alert" className="border border-redline/45 bg-ground p-4 font-mono text-[12px] text-redline sm:p-6">
      Could not load {what}. Check /health and the server logs.
    </p>
  );
}

function medianDetail(median: Median) {
  return median.sample === 0 ? "no data yet" : `median of ${formatCount(median.sample)}`;
}

function MessageCells({ stats }: { stats: MessageStats }) {
  const { byStatus } = stats;
  const total = byStatus.new + byStatus.read + byStatus.replied + byStatus.archived;
  return (
    <StatGrid>
      <Stat label="New" value={formatCount(byStatus.new)} tone={byStatus.new > 0 ? "accent" : "ink"} detail="unread" />
      <Stat label="Read" value={formatCount(byStatus.read)} detail="awaiting reply" />
      <Stat label="Replied" value={formatCount(byStatus.replied)} detail={`${formatPercent(byStatus.replied, total)} of all`} />
      <Stat label="Archived" value={formatCount(byStatus.archived)} detail={`${plural(total, "message")} all time`} />
      <Stat label="Time to read" value={formatDuration(stats.toRead.seconds)} detail={medianDetail(stats.toRead)} />
      <Stat label="Time to reply" value={formatDuration(stats.toReply.seconds)} detail={medianDetail(stats.toReply)} />
      <Stat label={`Last ${stats.days} days`} value={formatCount(stats.inWindow)} detail="received" />
      <Stat
        label="Today"
        value={formatCount(stats.perDay.at(-1)?.count ?? 0)}
        detail="received since 00:00 UTC"
      />
    </StatGrid>
  );
}

function NewestMessage({ message, now }: { message: RecentMessage; now: Date }) {
  return (
    <li>
      <Link
        href={`/messages?id=${message.id}`}
        className="group block py-3 outline-offset-2 hover:bg-surface sm:-mx-2 sm:px-2"
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="flex min-w-0 items-baseline gap-2">
            {message.status === "new" ? (
              <span aria-hidden="true" className="inline-block size-1.5 shrink-0 -translate-y-px bg-accent" />
            ) : null}
            <span className="truncate text-[14px] text-ink group-hover:text-accent">
              {message.status === "new" ? <span className="sr-only">Unread: </span> : null}
              {message.name}
            </span>
          </span>
          <time
            dateTime={message.createdAt.toISOString()}
            title={formatAbsoluteTime(message.createdAt)}
            className="shrink-0 font-mono text-[10px] text-ink-faint tabular-nums"
          >
            {formatRelativeTime(message.createdAt, now)}
          </time>
        </span>
        <span className="mt-1 block truncate text-[13px] text-ink-dim">{message.firstLine || "(empty message)"}</span>
      </Link>
    </li>
  );
}

function Newest({ messages, now }: { messages: RecentMessage[]; now: Date }) {
  return (
    <Panel
      id="newest"
      title="Newest"
      aside={
        <Link href="/messages" className="hover:text-accent">
          All messages →
        </Link>
      }
    >
      {messages.length === 0 ? (
        <p className="font-mono text-[11px] text-ink-faint">No messages yet.</p>
      ) : (
        <ol className="divide-y divide-line">
          {messages.map((message) => (
            <NewestMessage key={message.id} message={message} now={now} />
          ))}
        </ol>
      )}
    </Panel>
  );
}

function SitePulse({ pulse }: { pulse: PulseStats | null }) {
  const top = pulse?.referrers[0];
  return (
    <Panel
      id="site-pulse"
      title={`Site pulse · last ${PULSE_DAYS} days`}
      aside={
        <Link href="/pulse" className="hover:text-accent">
          Open pulse →
        </Link>
      }
    >
      {pulse ? (
        <StatGrid className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Views" value={formatCount(pulse.totals.views)} />
          <Stat label="Visitors" value={formatCount(pulse.totals.visitors)} detail="unique per day" />
          <Stat label="Time on page" value={formatDuration(pulse.medianSeconds)} detail="median" />
          <Stat
            label="Top referrer"
            value={<span className="block truncate text-lg">{top ? top.label : "n/a"}</span>}
            detail={top ? plural(top.count, "view") : undefined}
          />
          <Stat
            label="Resume"
            value={formatCount(pulse.clicks.resume)}
            detail={`${formatPercent(pulse.clicks.resume, pulse.totals.views)} of views`}
          />
          <Stat
            label="Email"
            value={formatCount(pulse.clicks.mailto)}
            detail={`${formatPercent(pulse.clicks.mailto, pulse.totals.views)} of views`}
          />
        </StatGrid>
      ) : (
        <LoadError what="page analytics" />
      )}
    </Panel>
  );
}

export default async function OverviewPage() {
  if (!(await hasAdminSession())) return null;

  const now = new Date();
  const [messages, pulse] = await Promise.all([
    settle("message stats", () => getMessageStats(WINDOW_DAYS)),
    settle("pulse stats", () => getPulseStats(PULSE_DAYS)),
  ]);

  return (
    <>
      <PageHeader
        title="Overview"
        meta={
          <>
            <span>{formatLongDay(now)}</span>
            <span className="text-accent">Last {WINDOW_DAYS} days · UTC</span>
          </>
        }
      />
      <div className="grid gap-4 sm:gap-6">
        {messages ? (
          <>
            <MessageCells stats={messages} />
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <Panel id="per-day" title="Messages per day" aside={plural(messages.inWindow, "message")}>
                <BarStrip data={messages.perDay.map((d) => ({ day: d.day, value: d.count }))} unit={{ one: "message" }} title="Messages per day" />
              </Panel>
              <Newest messages={messages.newest} now={now} />
            </div>
          </>
        ) : (
          <LoadError what="message stats" />
        )}
        <SitePulse pulse={pulse} />
      </div>
      <p className={`${monoLabel} mt-6 normal-case tracking-[0.08em]`}>
        Status counts and medians are all time; the chart and window totals are by UTC day.
      </p>
    </>
  );
}
