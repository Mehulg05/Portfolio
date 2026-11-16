/*
  Fills page_views with about 200 believable fake views over the last 30 days, so /pulse
  and the overview have something to draw in development. Local databases only: it
  refuses any DATABASE_URL that is not on this machine.

  Seeded rows are marked with a visitor_hash starting "seed-"; each run deletes the
  previous batch first, so running it twice does not double the chart. Remove them with:
    delete from page_views where visitor_hash like 'seed-%';

    DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/postgres node scripts/db-seed-pulse.mjs
*/
import { randomUUID } from "node:crypto";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const localHosts = new Set(["127.0.0.1", "localhost"]);
let hostname = "";
try {
  hostname = new URL(url).hostname;
} catch {
  // Falls through to the refusal below.
}
if (!localHosts.has(hostname)) {
  console.error("Refusing to seed: DATABASE_URL must point at 127.0.0.1 or localhost.");
  process.exit(1);
}

// Seeded PRNG (mulberry32) so every run draws the same chart.
let state = 0x5eed;
function random() {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function pick(weighted) {
  const total = weighted.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [value, weight] of weighted) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return weighted[weighted.length - 1][0];
}

const referrers = [
  [null, 40],
  ["www.linkedin.com", 22],
  ["www.google.com", 14],
  ["github.com", 10],
  ["t.co", 4],
  ["news.ycombinator.com", 3],
  ["duckduckgo.com", 3],
  ["www.bing.com", 2],
  ["mail.google.com", 2],
];
const countries = [["IN", 55], ["US", 15], [null, 8], ["GB", 6], ["DE", 5], ["SG", 4], ["CA", 3], ["NL", 2], ["AE", 2]];
const paths = [["/", 95], ["/projects", 3], ["/wp-login.php", 2]];
const pageSections = ["top", "experience", "client-work", "research", "system-map", "revision-history", "education", "contact"];

// Most people skim; a few read everything. Log-normal-ish, median around 50 seconds.
function drawSeconds() {
  const normal = Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  return Math.min(1800, Math.max(2, Math.round(Math.exp(3.9 + 1.1 * normal))));
}

function drawEngagement(path) {
  if (path !== "/") return { seconds: Math.round(2 + random() * 8), maxScrollPct: 100, sections: [] };
  // About one in seven opens the page and leaves from the hero.
  if (random() < 0.15) {
    return { seconds: Math.round(2 + random() * 6), maxScrollPct: Math.round(8 + random() * 14), sections: ["top"] };
  }
  const seconds = drawSeconds();
  // Longer visits scroll further, with noise.
  const depth = Math.min(1, 0.05 + Math.log10(seconds) / 3.2 + (random() - 0.5) * 0.4);
  const maxScrollPct = Math.round(Math.max(0.1, depth) * 100);
  const reached = Math.max(1, Math.ceil((maxScrollPct / 100) * pageSections.length));
  return { seconds, maxScrollPct, sections: pageSections.slice(0, reached) };
}

const now = new Date();
const dayMs = 24 * 60 * 60 * 1000;
const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
const rows = [];

for (let ago = 29; ago >= 0; ago -= 1) {
  const dayStart = todayStart - ago * dayMs;
  const weekday = new Date(dayStart).getUTCDay();
  const weekend = weekday === 0 || weekday === 6;
  // A post on LinkedIn nine days ago, with a tail on the days after.
  const spike = ago === 9 ? 22 : ago === 8 ? 9 : ago === 7 ? 4 : 0;
  const visitors = Math.round((weekend ? 2 : 4) + random() * 3 + spike);
  const dayEnd = ago === 0 ? now.getTime() : dayStart + dayMs;

  for (let v = 0; v < visitors; v += 1) {
    const visitorHash = `seed-${randomUUID().replaceAll("-", "")}`;
    const referrerHost = ago >= 7 && ago <= 9 && random() < 0.7 ? "www.linkedin.com" : pick(referrers);
    const country = pick(countries);
    const screen = random() < 0.55 ? "phone" : "desktop";
    const views = pick([[1, 80], [2, 15], [3, 5]]);
    for (let n = 0; n < views; n += 1) {
      const path = n === 0 ? pick(paths) : "/";
      const createdAt = new Date(dayStart + random() * (dayEnd - dayStart));
      const hasLeave = random() < 0.88;
      const engagement = hasLeave ? drawEngagement(path) : null;
      const readFar = engagement !== null && engagement.maxScrollPct > 30;
      rows.push({
        id: randomUUID(),
        createdAt,
        visitorHash,
        path,
        referrerHost,
        screen,
        country,
        engagement,
        resumeClicked: readFar && random() < 0.12,
        mailtoClicked: engagement?.sections.includes("contact") === true && random() < 0.2,
      });
    }
  }
}

const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  const removed = await sql.begin(async (tx) => {
    const deleted = await tx`delete from page_views where visitor_hash like 'seed-%'`;
    for (const row of rows) {
      const e = row.engagement;
      await tx`
        insert into page_views (
          id, created_at, day, visitor_hash, path, referrer_host, screen, country,
          seconds, max_scroll_pct, sections, resume_clicked, mailto_clicked
        ) values (
          ${row.id}, ${row.createdAt}, (${row.createdAt}::timestamptz at time zone 'utc')::date,
          ${row.visitorHash}, ${row.path}, ${row.referrerHost}, ${row.screen}, ${row.country},
          ${e ? e.seconds : null}, ${e ? e.maxScrollPct : null},
          ${e ? e.sections : null}::text[], ${row.resumeClicked}, ${row.mailtoClicked}
        )
      `;
    }
    return deleted.count;
  });
  console.log(`Removed ${removed} earlier seed row(s); inserted ${rows.length} page views over 30 days.`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
