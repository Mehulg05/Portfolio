import type { Metadata } from "next";
import { BarStrip } from "@/app/admin/_charts/BarStrip";
import { Distribution } from "@/app/admin/_charts/Distribution";
import { formatCount, formatDuration, formatLongDay, formatPercent } from "@/app/admin/_charts/format";
import { Funnel } from "@/app/admin/_charts/Funnel";
import { HBarList, type HBarItem } from "@/app/admin/_charts/HBarList";
import { PageHeader, Panel, Stat, StatGrid } from "@/app/admin/_charts/Panel";
import { Split } from "@/app/admin/_charts/Split";
import { hasAdminSession } from "@/lib/admin/auth";
import { errorClass } from "@/lib/admin/health";
import { sections } from "@/lib/content/sections";
import { getPulseStats, type PulseCount, type PulseStats } from "@/lib/pulse/stats";

// Reads a cookie and live rows on every request; nothing here may be cached or prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pulse" };

const WINDOW_DAYS = 30;

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const sectionLabels = new Map<string, string>(sections.map((s) => [s.id, s.label]));

function countryLabel(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return <span className="text-ink-faint">{code}</span>;
  let name: string | undefined;
  try {
    name = regionNames.of(code);
  } catch {
    name = undefined;
  }
  return (
    <>
      <span className="font-mono text-[11px] text-ink-dim">{code}</span>
      {name && name !== code ? <span className="ml-2">{name}</span> : null}
    </>
  );
}

function referrerLabel(host: string) {
  return host === "direct" ? <span className="text-ink-faint">direct / none</span> : host;
}

function toItems(counts: PulseCount[], label: (value: string) => HBarItem["label"]): HBarItem[] {
  return counts.map((c) => ({ key: c.label, label: label(c.label), count: c.count }));
}

function rate(part: number, views: number) {
  return `${formatPercent(part, views)} of views`;
}

function Totals({ stats }: { stats: PulseStats }) {
  const { totals, clicks } = stats;
  return (
    <StatGrid className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
      <Stat label="Views" value={formatCount(totals.views)} detail={`last ${stats.days} days`} />
      <Stat label="Visitors" value={formatCount(totals.visitors)} detail="unique per day, summed" />
      <Stat
        label="Views / visitor"
        value={totals.visitors > 0 ? (totals.views / totals.visitors).toFixed(1) : "n/a"}
        detail="per visitor-day"
      />
      <Stat label="Time on page" value={formatDuration(stats.medianSeconds)} detail="median" />
      <Stat label="Resume opens" value={formatCount(clicks.resume)} detail={rate(clicks.resume, totals.views)} />
      <Stat label="Email clicks" value={formatCount(clicks.mailto)} detail={rate(clicks.mailto, totals.views)} />
    </StatGrid>
  );
}

function PrivacyNote() {
  return (
    <p className="mt-8 max-w-3xl border-t border-line pt-4 font-mono text-[11px] leading-relaxed text-ink-faint">
      Collected first-party by this site, without cookies. IP addresses are never stored: the visitor id is an HMAC
      keyed with a random salt that exists for one day and is then deleted, so nobody, me included, can follow a
      visitor from one day to the next. Browsers sending Do Not Track or Global Privacy Control are not counted. Rows older than 90 days
      are deleted by the daily cron.
    </p>
  );
}

function PulseError() {
  return (
    <p role="alert" className="border border-redline/45 bg-ground p-4 font-mono text-[12px] text-redline sm:p-6">
      Could not load page analytics. Check /health and the server logs.
    </p>
  );
}

async function loadStats() {
  try {
    return await getPulseStats(WINDOW_DAYS);
  } catch (error) {
    console.error(`[pulse] stats failed: ${errorClass(error)}`);
    return null;
  }
}

export default async function PulsePage() {
  if (!(await hasAdminSession())) return null;

  const now = new Date();
  const stats = await loadStats();

  return (
    <>
      <PageHeader
        title="Pulse"
        meta={
          <>
            <span>{formatLongDay(now)}</span>
            <span className="text-accent">Last {WINDOW_DAYS} days · UTC</span>
          </>
        }
      />
      {stats ? (
        <div className="grid gap-4 sm:gap-6">
          <Totals stats={stats} />

          <Panel id="views-per-day" title="Views per day" aside={`${formatCount(stats.totals.views)} views`}>
            <BarStrip
              data={stats.daily.map((d) => ({ day: d.day, value: d.views, secondary: d.visitors }))}
              unit={{ one: "view" }}
              secondaryUnit={{ one: "visitor" }}
              title="Views per day with unique visitors"
            />
          </Panel>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <Panel id="referrers" title="Referrers" aside="share of views">
              <HBarList
                title="Top referrers"
                items={toItems(stats.referrers, referrerLabel)}
                total={stats.totals.views}
                empty="No referrers yet."
              />
            </Panel>
            <Panel id="countries" title="Countries" aside="share of views">
              <HBarList
                title="Top countries"
                items={toItems(stats.countries, countryLabel)}
                total={stats.totals.views}
                empty="No countries yet."
              />
            </Panel>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <Panel id="sections" title="How far down the page" aside="share of the first section">
              <Funnel
                title="Views reaching each section, in page order"
                unit="view"
                steps={stats.sections.map((s) => ({
                  key: s.label,
                  label: sectionLabels.get(s.label) ?? s.label,
                  count: s.count,
                }))}
              />
            </Panel>
            <div className="grid content-start gap-4 sm:gap-6">
              <Panel id="scroll-depth" title="Scroll depth" aside="max reached per view">
                <Distribution title="Maximum scroll depth per view" unit="views" buckets={stats.scrollDepth} />
              </Panel>
              <Panel id="screens" title="Screens">
                <Split title="Views by screen size" parts={stats.screens} />
              </Panel>
            </div>
          </div>
        </div>
      ) : (
        <PulseError />
      )}
      <PrivacyNote />
    </>
  );
}
