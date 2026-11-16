/*
  Enforces the retention windows by hand: page views older than 90 days and sign-in
  attempts older than a day (the throttle only ever looks back minutes). The beacon route
  prunes page views on its own about once per hundred requests; this is for a quiet site
  or a one-off cleanup.

    DATABASE_URL=... npm run db:prune
*/
import { connect, inSchema } from "./db-connect.mjs";

// Same numbers as lib/db/retention.ts (PAGE_VIEW_RETENTION_DAYS, LOGIN_ATTEMPT_RETENTION_SECONDS); keep them in step.
const pageViewDays = 90;
const loginAttemptDays = 1;
const sql = connect();

try {
  const [views, attempts] = await inSchema(sql, (tx) =>
    Promise.all([
      tx`delete from page_views where created_at < now() - make_interval(days => ${pageViewDays})`,
      tx`delete from login_attempts where created_at < now() - make_interval(days => ${loginAttemptDays})`,
    ]),
  );
  console.log(`page_views      ${views.count} deleted (older than ${pageViewDays} days)`);
  console.log(`login_attempts  ${attempts.count} deleted (older than ${loginAttemptDays} day)`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
