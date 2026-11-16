# Contact backend

The form posts to `app/api/contact/route.ts`, which validates, rate limits and inserts a row into Postgres (`messages`), then emails a copy through Resend. The row is the source of truth; `/inbox` reads it. Everything runs on free tiers.

**Database (Neon free tier).** Create a project at console.neon.tech, open *Connect*, tick *Connection pooling* and copy that URL (its host contains `-pooler`). Create the table once from your machine: `DATABASE_URL='<pooled url>' npm run db:migrate`. Later migrations are new numbered files in `lib/db/migrations/`, applied the same way; applied files are tracked in `schema_migrations`.

**Email (Resend free tier).** Sign up at resend.com with the address that should receive messages, then create an API key. The sender is `onboarding@resend.dev`, which Resend only delivers to the account owner's own address: exactly this case. A verified custom domain is optional later. Without a key, messages are still stored and `notified_at` stays null.

**Secrets.** Run `openssl rand -hex 32` twice: one value for `INBOX_SECRET` (the `/inbox` password and cookie signing key; rotating it signs everyone out), one for `IP_HASH_SALT` (IPs are stored only as HMACs).

**Vercel env vars (Production and Preview):** `DATABASE_URL`, `RESEND_API_KEY`, `INBOX_SECRET`, `IP_HASH_SALT`, `NEXT_PUBLIC_SITE_URL=https://mehulgupta.me`, and optionally `CONTACT_TO_EMAIL`. Redeploy after adding them: the contact section checks `DATABASE_URL` at build time and shows the email address instead of a form when it is missing.

**Local development.** `npm run db:dev` starts PGlite (Postgres compiled to WASM) on port 5433 with data in `.pglite/`. In another terminal: `cp .env.example .env.local`, set a dev `INBOX_SECRET`, run `npm run db:migrate` with the same `DATABASE_URL`, then `npm run dev`. `npm run db:inspect` prints recent rows; `npm test` runs the validation and email-builder tests.
