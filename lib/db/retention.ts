/*
  How long each kind of row is kept. The daily cron, the beacon route's own pruning and
  scripts/db-prune.mjs (which repeats the numbers in plain JS; keep them in step) all read these.
*/

export const PAGE_VIEW_RETENTION_DAYS = 90;
/** Sign-in throttling only looks back minutes; a day of rows is plenty of evidence. */
export const LOGIN_ATTEMPT_RETENTION_SECONDS = 24 * 60 * 60;
/** Dates shown to the owner (CSV file names, day buckets) use this zone. */
export const OWNER_TIME_ZONE = "Asia/Kolkata";
