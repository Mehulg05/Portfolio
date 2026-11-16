# Contact backend

The form posts to `app/api/contact/route.ts`, which validates, rate limits and inserts a row into Postgres (`messages`), then emails a copy through Resend (`lib/contact/owner.ts`, shared with the retry path). The row is the source of truth; the admin panel (`docs/admin-panel.md`) reads it. Everything runs on free tiers.

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

**Vercel env vars (Production only):** `DATABASE_URL`, `RESEND_API_KEY`, `INBOX_SECRET`, `IP_HASH_SALT`, `NEXT_PUBLIC_SITE_URL=https://mehulgupta.me`, `ADMIN_HOST`, `CRON_SECRET` (32+ characters), and optionally `CONTACT_TO_EMAIL` (and `DATABASE_SCHEMA` only in the fallback). Do not add the database or the secrets to Preview: previews would write to the production data, and they show the email fallback instead of the form, which is fine. Redeploy after adding them: the contact section checks `DATABASE_URL` **and `IP_HASH_SALT`** at build time and shows the email address instead of a form when either is missing.

**Local development.** `npm run db:dev` starts PGlite (Postgres compiled to WASM) on port 5433 with data in `.pglite/`. In another terminal: `cp .env.example .env.local`, set a dev `INBOX_SECRET`, run `npm run db:migrate` with the same `DATABASE_URL`, then `npm run dev`. `npm run db:inspect` prints recent rows; `npm run db:seed-pulse` fills `page_views` with fake views for the analytics pages (local databases only). `PGLITE_PORT` changes the port `db:dev` listens on (default 5433; update `DATABASE_URL` to match). `npm test` runs every `lib/**/*.test.mjs`: validation, the email builder, session signing, the IP and request helpers, the CSP builders, the redirect guard, the cursor codec and the host routing in `proxy.ts`.

**Bounded writes.** Three endpoints write without a login, into a database whose free tier is shared with Alpha Academy, so each has a global ceiling as well as per-sender limits:

| Endpoint | Per sender | Across everyone |
|---|---|---|
| `POST /api/contact` | 5 per hour and 10 per day per IP hash, 3 per day per email | 30 per hour, 80 per day (under Resend's free 100) |
| `POST /api/pulse` (views) | 30 per hour per visitor, 60 per hour per network | 300 per hour, 3,000 per day |
| `POST /api/admin/session` (failures) | 15 per minute per IP hash, then locked out | 300 failures per minute; past that, failures are refused but no longer stored |

Contact limits are checked and the row inserted in one transaction under an advisory lock, so they are exact under concurrency. Every window answers with the same 429, so a sender cannot tell which limit it hit. Leave beacons only update a row their own view created, so they cannot add storage.

**Response contract.** Anything that returns JSON uses `{ "ok": false, "code", "message" }` for errors (`lib/http/response.ts`): contact adds an optional `field`; `/api/cron` uses `unauthorised` (401, also when `CRON_SECRET` is unset or short, so nothing says whether it is configured) and `unconfigured`. `/api/pulse` always answers an empty 204, by design. The form-posted admin routes answer `text/plain` or a 303 back to the page, because browsers render their answer directly.

**Database timeouts.** The client uses a 5 s connect timeout. For a statement timeout run once as the database owner (Neon's pooler does not carry startup parameters, so it must be a role default): `ALTER ROLE portfolio_app SET statement_timeout = '8s';`.

**Security headers.** `next.config.ts` sets `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS (with `includeSubDomains`) and `Cross-Origin-Opener-Policy` on every response; `proxy.ts` sets the `Content-Security-Policy` in production (`lib/http/csp.ts`). Nothing is allowed from a third party. The public site needs `script-src 'unsafe-inline'` because its pages are prerendered, so Next's inline scripts cannot carry a nonce; the admin host uses a per-request nonce with `strict-dynamic`, `no-store` and `Referrer-Policy: no-referrer`.
