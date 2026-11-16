/*
  Both formats are computed on the server at request time; the page is force-dynamic and
  has no client JS, so "3h ago" is accurate when the page loads and is never hydrated
  against a different clock.
*/
import { OWNER_TIME_ZONE } from "@/lib/db/retention";

// Vercel renders in UTC; pinning the owner's zone (OWNER_TIME_ZONE) keeps absolute times readable at a glance.

// numeric "always" keeps every label in the same "3d ago" shape; "auto" mixes in "last wk.".
const relative = new Intl.RelativeTimeFormat("en", { numeric: "always", style: "narrow" });

const absolute = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: OWNER_TIME_ZONE,
  timeZoneName: "short",
});

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: OWNER_TIME_ZONE,
});

const steps: [limitSeconds: number, unit: Intl.RelativeTimeFormatUnit, seconds: number][] = [
  [60 * 60, "minute", 60],
  [60 * 60 * 24, "hour", 60 * 60],
  [60 * 60 * 24 * 7, "day", 60 * 60 * 24],
  [60 * 60 * 24 * 30, "week", 60 * 60 * 24 * 7],
  [60 * 60 * 24 * 365, "month", 60 * 60 * 24 * 30],
];

export function formatRelativeTime(date: Date, now: Date) {
  // Clamped so a few seconds of clock skew between app and database never reads "in 2s".
  const elapsed = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  if (elapsed < 60) return "just now";
  for (const [limit, unit, seconds] of steps) {
    if (elapsed < limit) return relative.format(-Math.floor(elapsed / seconds), unit);
  }
  return relative.format(-Math.floor(elapsed / (60 * 60 * 24 * 365)), "year");
}

export function formatAbsoluteTime(date: Date) {
  return absolute.format(date);
}

export function formatShortDate(date: Date) {
  return shortDate.format(date);
}
