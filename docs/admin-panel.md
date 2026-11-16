# Admin panel

`admin.mehulgupta.me` is the same Vercel deployment as the site. `proxy.ts` sees the admin host and maps its paths onto `app/admin/**`; the public host redirects `/inbox` and `/admin/*` there (a temporary 307: switch `redirectToAdmin` in `proxy.ts` to 308 once the admin host is live and stable, because browsers cache a 308 for good) and refuses admin APIs, including paths that end in a file extension. Icons and social images (`/icon`, `/apple-icon`, `/opengraph-image`) are served unrewritten on both hosts; `/favicon.ico` rewrites to `/icon`. Every admin response is `noindex` and the host's `robots.txt` disallows everything. The session cookie is host-only, so it never exists on the public site.

**DNS and Vercel.** Add a CNAME record `admin` → `cname.vercel-dns.com` at your DNS provider. In the Vercel project, Settings → Domains → add `admin.mehulgupta.me` (same project, no redirect). Set `ADMIN_HOST=admin.mehulgupta.me` (the default) and `CRON_SECRET` (`openssl rand -hex 32`) in Production, then redeploy. `INBOX_SECRET` (32+ characters) is no longer typed to sign in under normal use: it is the key that signs the session cookie and keys the code hashes, and it doubles as the break-glass recovery key (see Sign-in).

**Sign-in.** Click *Email me a code*; the server generates a random 6-digit code, stores only its HMAC (keyed by `INBOX_SECRET`) with a 10-minute expiry in `admin_login_codes` (migration `0004`), and emails it through Resend to `CONTACT_TO_EMAIL` (profile email if unset), never to an address the browser supplies. A code works once, and dies after 5 wrong guesses. Requests are limited to 3 per 10 minutes in total, and the page answers the same whether or not a code was sent. Entering it issues a signed 7-day cookie (`__Host-admin_session` in production, `SameSite=Strict`, `HttpOnly`, `Secure`). The signing key is derived from `INBOX_SECRET`, not the secret itself.

*Sign out revokes.* Signing out (only possible while signed in) records a revocation time in `admin_session_state` (migration `0005`), and every cookie issued before it stops working, so a copied cookie dies too. If the database cannot be read, the signature and expiry decide, so an outage never locks the owner out of `/health`. Run `npm run db:migrate` for `0005` before relying on this; until then sign-out only clears the browser's cookie. Deploying the new cookie format signs out any existing session once.

*Throttle:* 15 failed sign-ins (code or recovery key) per IP hash per 1-minute window (`LOGIN_FAILURE_LIMIT` / `LOGIN_WINDOW_SECONDS` in `lib/admin/otp-core.ts`), counted since that IP's last success. A locked-out source stops adding rows (the lockout ends a window later), and above 300 failures per minute from all sources none are stored (`GLOBAL_FAILURE_CEILING`), so the table cannot be grown by unauthenticated traffic. The client IP comes from `x-vercel-forwarded-for` on Vercel, which a client cannot set.

*Resend key (free):* sign up at resend.com with the same address as `CONTACT_TO_EMAIL` (the shared `onboarding@resend.dev` sender only delivers to the account owner), create an API key under API Keys (sending access), add it in Vercel as `RESEND_API_KEY` for Production, and redeploy. Run `npm run db:migrate` for `0004` first.

*Recovery key:* while `RESEND_API_KEY` is unset the page says so and shows the `INBOX_SECRET` form. Once it is set, that form hides behind *Use recovery key* so you can still get in if email is down or the 3-per-10-minutes budget was burned by someone else. Rotating `INBOX_SECRET` signs out every session.

**Pages.**
- `/` Overview: messages per day for 30 days, counts by status, median time to read and to reply, the newest three messages, a seven-day site pulse.
- `/messages` Triage: status tabs, search, 50 per page, full message with reply, read, replied, archive and delete; `j`/`k`/`Enter`/`r`/`e` shortcuts; CSV export of the current filter.
- `/pulse` Site analytics: views and unique visitors per day, referrers, countries, time on page, scroll depth, how far down the page visitors get, resume and email clicks.
- `/health` Database latency and migration version, notification backlog with a retry button, env checklist (set or missing, never values), deploy commit and region.

**Region.** `vercel.json` pins functions to `sin1` (Singapore) because the Neon database is in AWS ap-southeast-1. The Vercel default (`iad1`, Washington) put an ocean between every query and the database: admin pages took 1 to 3 s. Keep the function region next to the database.

**Cron.** `vercel.json` schedules `GET /api/cron` daily (Hobby allows one). It prunes page views older than 90 days and old sign-in attempts, and retries pending email notifications. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically. `CRON_SECRET` must be 32+ characters; a shorter or missing one makes the route answer 401 like a wrong one. Retention periods live in `lib/db/retention.ts`.

**Headers.** Every admin response carries a strict CSP with a per-request nonce, `frame-ancestors 'none'`, `no-store` and `Referrer-Policy: no-referrer` (see `docs/contact-backend.md`, Security headers).

**Admin DNS.** If a CNAME for `admin` exists at the DNS provider but the domain is not added to the Vercel project, remove the CNAME or add the domain: a dangling record to a hosted platform is the shape of a subdomain takeover.

**Pulse privacy.** No cookies, no local storage and no stored IP addresses: a visitor is an HMAC of IP and user agent keyed with a random salt that is generated each day and deleted when the day ends, so visits cannot be linked across days, not even by the owner. Browsers that send Do Not Track or Global Privacy Control send nothing at all, and the admin host is never counted. Rows are deleted after 90 days.

**Local.** Add `ADMIN_HOST=admin.localhost` to `.env.local`, run `npm run db:dev`, `npm run db:migrate`, `npm run dev`, and open `http://admin.localhost:3000`. `PULSE_DEV=1` records your own local page views; `npm run db:prune` applies retention by hand.
