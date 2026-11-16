import "server-only";
import { sections as pageSections } from "@/lib/content/sections";
import { getDb } from "@/lib/db/client";

export type PulseCount = { label: string; count: number };
export type PulseDay = { day: string; views: number; visitors: number }; // "YYYY-MM-DD", zero-filled, oldest first
export type PulseStats = {
  days: number;
  daily: PulseDay[];
  totals: { views: number; visitors: number };
  referrers: PulseCount[];
  countries: PulseCount[];
  screens: PulseCount[];
  medianSeconds: number | null;
  scrollDepth: PulseCount[];
  sections: PulseCount[];
  clicks: { resume: number; mailto: number };
};

/*
  Aggregates for /pulse and the overview. The window is whole UTC days: today plus the
  `days - 1` before it, the same days the daily chart shows, so the totals always equal
  the sum of the bars. Every query is bounded on created_at from the start of the first
  day, which the page_views_created_at_idx index serves.

  Sections: every id in lib/content/sections.ts, in page order, zero-filled, ids from
  elsewhere ignored. "top" (the hero) is kept: its top edge starts above the viewport
  middle, so nearly every view reports it, and that makes it the baseline the other
  sections read against.
*/

const maxDays = 365;
const listLimit = 10;
const screens = ["phone", "desktop"] as const;
const scrollBuckets = ["0-25%", "25-50%", "50-75%", "75-100%"] as const;

type DailyRow = { day: string; views: number; visitors: number };
type SummaryRow = {
  median: number | null;
  s0: number;
  s1: number;
  s2: number;
  s3: number;
  resume: number;
  mailto: number;
};

function clampDays(days: number) {
  if (!Number.isFinite(days)) return 30;
  return Math.min(maxDays, Math.max(1, Math.trunc(days)));
}

function windowStart(days: number) {
  return getDb()`(((now() at time zone 'utc')::date - ${days - 1}::int)::timestamp at time zone 'utc')`;
}

async function daily(days: number) {
  return getDb()<DailyRow[]>`
    with series as (
      select ((now() at time zone 'utc')::date - offs)::date as day
      from generate_series(${days - 1}::int, 0, -1) as offs
    ),
    counts as (
      select day, count(*)::int as views, count(distinct visitor_hash)::int as visitors
      from page_views
      where created_at >= ${windowStart(days)}
      group by day
    )
    select to_char(series.day, 'YYYY-MM-DD') as day,
           coalesce(counts.views, 0)::int as views,
           coalesce(counts.visitors, 0)::int as visitors
    from series left join counts using (day)
    order by series.day
  `;
}

/*
  Scroll buckets include their lower bound: 25 lands in "25-50%", 100 in "75-100%".
  Rows without a leave beacon (seconds and scroll still null) count as views but are
  left out of the median and the buckets rather than read as zero.
*/
async function summary(days: number) {
  const [row] = await getDb()<SummaryRow[]>`
    select
      percentile_cont(0.5) within group (order by seconds) as median,
      count(*) filter (where max_scroll_pct < 25)::int as s0,
      count(*) filter (where max_scroll_pct >= 25 and max_scroll_pct < 50)::int as s1,
      count(*) filter (where max_scroll_pct >= 50 and max_scroll_pct < 75)::int as s2,
      count(*) filter (where max_scroll_pct >= 75)::int as s3,
      count(*) filter (where resume_clicked)::int as resume,
      count(*) filter (where mailto_clicked)::int as mailto
    from page_views
    where created_at >= ${windowStart(days)}
  `;
  return row;
}

async function topReferrers(days: number) {
  return getDb()<PulseCount[]>`
    select coalesce(referrer_host, 'direct') as label, count(*)::int as count
    from page_views
    where created_at >= ${windowStart(days)}
    group by 1 order by count desc, label limit ${listLimit}
  `;
}

async function topCountries(days: number) {
  return getDb()<PulseCount[]>`
    select coalesce(country, 'unknown') as label, count(*)::int as count
    from page_views
    where created_at >= ${windowStart(days)}
    group by 1 order by count desc, label limit ${listLimit}
  `;
}

async function screenCounts(days: number) {
  const rows = await getDb()<PulseCount[]>`
    select screen as label, count(*)::int as count
    from page_views
    where created_at >= ${windowStart(days)}
    group by screen
  `;
  return screens.map((label) => ({ label, count: rows.find((row) => row.label === label)?.count ?? 0 }));
}

async function sectionCounts(days: number) {
  const ids = pageSections.map((section) => section.id);
  const rows = await getDb()<PulseCount[]>`
    select section as label, count(distinct page_views.id)::int as count
    from page_views, unnest(page_views.sections) as section
    where created_at >= ${windowStart(days)} and section = any(${ids}::text[])
    group by section
  `;
  return ids.map((label) => ({ label, count: rows.find((row) => row.label === label)?.count ?? 0 }));
}

function scrollDepth(row: SummaryRow | undefined): PulseCount[] {
  const counts = [row?.s0, row?.s1, row?.s2, row?.s3];
  return scrollBuckets.map((label, index) => ({ label, count: counts[index] ?? 0 }));
}

// percentile_cont interpolates (10 and 11 give 10.5); the page shows whole seconds.
function roundMedian(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : null;
}

export async function getPulseStats(days = 30): Promise<PulseStats> {
  const window = clampDays(days);
  const [dailyRows, summaryRow, referrers, countries, screenRows, sections] = await Promise.all([
    daily(window),
    summary(window),
    topReferrers(window),
    topCountries(window),
    screenCounts(window),
    sectionCounts(window),
  ]);

  const dailyCounts = dailyRows.map(({ day, views, visitors }) => ({ day, views, visitors }));
  return {
    days: window,
    daily: dailyCounts,
    totals: {
      views: dailyCounts.reduce((sum, day) => sum + day.views, 0),
      // A hash only identifies someone within one UTC day, so per-day uniques are summed.
      visitors: dailyCounts.reduce((sum, day) => sum + day.visitors, 0),
    },
    referrers: referrers.map(({ label, count }) => ({ label, count })),
    countries: countries.map(({ label, count }) => ({ label, count })),
    screens: screenRows,
    medianSeconds: roundMedian(summaryRow?.median),
    scrollDepth: scrollDepth(summaryRow),
    sections,
    clicks: { resume: summaryRow?.resume ?? 0, mailto: summaryRow?.mailto ?? 0 },
  };
}
