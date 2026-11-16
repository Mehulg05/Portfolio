# Contact backend

The form posts to `app/api/contact/route.ts`, which validates, rate limits and inserts a row into Postgres (`messages`), then emails a copy through Resend. The row is the source of truth; the admin panel (`docs/admin-panel.md`) reads it. Everything runs on free tiers.

**Database (the existing Alpha Academy Neon project).** The portfolio gets its own database and role inside that project, so its `DATABASE_URL` cannot reach Alpha Academy's tables. In the Neon console, open the project, then either use *Roles → New role* (`portfolio_app`) and *Databases → New database* (`portfolio`, owner `portfolio_app`), or run this in the SQL editor:

```sql
-- connected to the project's default database
CREATE ROLE portfolio_app LOGIN PASSWORD '<openssl rand -base64 24>';
CREATE DATABASE portfolio;
GRANT ALL ON DATABASE portfolio TO portfolio_app;
-- then switch the editor to the portfolio database
GRANT ALL ON SCHEMA public TO portfolio_app;
```

`portfolio_app` holds no privileges on Alpha Academy's tables (Postgres grants none by default). Open *Connect*, pick database `portfolio` and role `portfolio_app`, tick *Connection pooling*, copy the URL (host contains `-pooler`), and create the tables: `DATABASE_URL='<that url>' npm run db:migrate`. The runner only creates and alters its own tables and tracks them in `portfolio_schema_migrations`. The free-tier compute is shared with Alpha Academy; the portfolio's load (a few queries per visit) is negligible. Alpha Academy branches created before the `portfolio` database existed will not contain it.

*Fallback, if a second database is not possible:* create a schema instead (`CREATE SCHEMA portfolio AUTHORIZATION portfolio_app; ALTER ROLE portfolio_app SET search_path TO portfolio;`) and set `DATABASE_SCHEMA=portfolio` both in Vercel and when running `npm run db:migrate`.

**Email (Resend free tier).** Sign up at resend.com with the address that should receive messages, then create an API key. The sender is `onboarding@resend.dev`, which Resend only delivers to the account owner's own address: exactly this case. A verified custom domain is optional later. Without a key, messages are still stored and `notified_at` stays null.

**Secrets.** Run `openssl rand -hex 32` twice: one value for `INBOX_SECRET` (the admin panel password and cookie signing key, 32+ characters; rotating it signs everyone out), one for `IP_HASH_SALT` (IPs are stored only as HMACs).

**Vercel env vars (Production and Preview):** `DATABASE_URL`, `RESEND_API_KEY`, `INBOX_SECRET`, `IP_HASH_SALT`, `NEXT_PUBLIC_SITE_URL=https://mehulgupta.me`, `ADMIN_HOST`, `CRON_SECRET`, and optionally `CONTACT_TO_EMAIL` (and `DATABASE_SCHEMA` only in the fallback). Redeploy after adding them: the contact section checks `DATABASE_URL` at build time and shows the email address instead of a form when it is missing.

**Local development.** `npm run db:dev` starts PGlite (Postgres compiled to WASM) on port 5433 with data in `.pglite/`. In another terminal: `cp .env.example .env.local`, set a dev `INBOX_SECRET`, run `npm run db:migrate` with the same `DATABASE_URL`, then `npm run dev`. `npm run db:inspect` prints recent rows; `npm test` runs the validation and email-builder tests.
