import "server-only";
import { getDb } from "@/lib/db/client";
import type { PulseLeave, PulseView } from "@/lib/pulse/validate";

export type NewPageView = PulseView & { visitorHash: string; sourceHash: string; country: string | null };

/*
  `day` is written explicitly as the UTC date rather than left to the column default,
  which follows the session time zone. The visitor hash rotates on the UTC day too, so
  "visitors per day" counts distinct hashes within one key period.
*/
export async function insertPageView(view: NewPageView) {
  await getDb()`
    insert into page_views (id, day, visitor_hash, source_hash, path, referrer_host, screen, country)
    values (
      ${view.viewId}, (now() at time zone 'utc')::date, ${view.visitorHash}, ${view.sourceHash},
      ${view.path}, ${view.referrerHost}, ${view.screen}, ${view.country}
    )
    on conflict (id) do nothing
  `;
}

/*
  The visitor_hash match means guessing someone's view id is not enough to rewrite their
  row; the one-day bound keeps a stale tab from editing old data and lets the planner use
  the primary key alone. Click flags only ever turn on, so a later leave beacon with
  fewer clicks (a second visibility change, say) cannot erase an earlier one.
*/
export async function recordLeave(leave: PulseLeave, visitorHash: string) {
  await getDb()`
    update page_views set
      seconds = ${leave.seconds},
      max_scroll_pct = ${leave.maxScrollPct},
      sections = ${leave.sections}::text[],
      resume_clicked = resume_clicked or ${leave.resumeClicked},
      mailto_clicked = mailto_clicked or ${leave.mailtoClicked}
    where id = ${leave.viewId}
      and visitor_hash = ${visitorHash}
      and created_at > now() - interval '1 day'
  `;
}

export type RecentViews = { visitor: number; source: number; globalHour: number; globalDay: number };

/**
 * Recent views by visitor (ip + user agent), by source (network only) and across everyone,
 * in one round trip. The first two use their indexes; the global counts scan one day of
 * rows, which the ceilings below keep small.
 */
export async function countRecentViews(keys: { visitorHash: string; sourceHash: string }, windowSeconds: number) {
  const [row] = await getDb()<RecentViews[]>`
    select
      (select count(*)::int from page_views
        where visitor_hash = ${keys.visitorHash} and created_at > now() - make_interval(secs => ${windowSeconds})) as visitor,
      (select count(*)::int from page_views
        where source_hash = ${keys.sourceHash} and created_at > now() - make_interval(secs => ${windowSeconds})) as source,
      (select count(*)::int from page_views where created_at > now() - interval '1 hour') as "globalHour",
      (select count(*)::int from page_views where created_at > now() - interval '1 day') as "globalDay"
  `;
  return row ?? { visitor: 0, source: 0, globalHour: 0, globalDay: 0 };
}

/** Deletes page views older than the retention window and returns how many went. */
export async function pruneOldPageViews(retentionDays: number) {
  const result = await getDb()`
    delete from page_views where created_at < now() - make_interval(days => ${retentionDays})
  `;
  return result.count;
}
