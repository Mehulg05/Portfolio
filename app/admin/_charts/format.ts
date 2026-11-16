/*
  Number and date formatting for the dashboards. Every day key is a UTC "YYYY-MM-DD"
  (the SQL buckets by UTC date), so labels are formatted in UTC too: a bar labelled
  "12 Nov" holds exactly the rows the query put in that bucket.
*/

const dayLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const longDay = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const integer = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

const DAY_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDayKey(day: string) {
  const match = DAY_KEY.exec(day);
  return match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))) : null;
}

/** "2026-11-12" as "12 Nov". Anything that is not a day key is shown as given. */
export function formatDay(day: string) {
  const date = parseDayKey(day);
  return date ? dayLabel.format(date) : day;
}

/** "Mon, 16 Nov 2026" for the page headers. */
export function formatLongDay(date: Date) {
  return longDay.format(date);
}

export function formatCount(value: number) {
  return integer.format(value);
}

/** One decimal under ten, whole numbers above, and never a trailing ".0". */
function compact(value: number) {
  const rounded = value < 10 ? Math.round(value * 10) / 10 : Math.round(value);
  return String(rounded);
}

/** A duration in seconds as "45 s", "12 min", "3 h", "1.5 d"; "n/a" when there is no data. */
export function formatDuration(seconds: number | null) {
  if (seconds === null || !Number.isFinite(seconds)) return "n/a";
  const s = Math.max(0, seconds);
  // Boundaries sit where rounding would reach the next unit, so 59.6 s reads "1 min", not "60 s".
  if (s < 59.5) return `${Math.round(s)} s`;
  if (s < 59.5 * 60) return `${compact(s / 60)} min`;
  if (s < 23.5 * 3600) return `${compact(s / 3600)} h`;
  return `${compact(s / 86400)} d`;
}

/** part / whole as "24%", "0.8%" under one percent, and "n/a" when the whole is zero. */
export function formatPercent(part: number, whole: number) {
  if (whole <= 0) return "n/a";
  const pct = (part / whole) * 100;
  if (pct > 0 && pct < 1) return `${pct.toFixed(1)}%`;
  return `${Math.round(pct)}%`;
}

export function plural(count: number, one: string, many = `${one}s`) {
  return `${formatCount(count)} ${count === 1 ? one : many}`;
}
