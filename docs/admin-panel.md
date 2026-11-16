# Admin panel

`admin.mehulgupta.me` is the same Vercel deployment as the site. `proxy.ts` sees the admin host and maps its paths onto `app/admin/**`; the public host redirects `/inbox` and `/admin/*` there and refuses admin APIs. Every admin response is `noindex` and the host's `robots.txt` disallows everything. The session cookie is host-only, so it never exists on the public site.

**DNS and Vercel.** Add a CNAME record `admin` → `cname.vercel-dns.com` at your DNS provider. In the Vercel project, Settings → Domains → add `admin.mehulgupta.me` (same project, no redirect). Set `ADMIN_HOST=admin.mehulgupta.me` (the default) and `CRON_SECRET` (`openssl rand -hex 32`) in Production, then redeploy. `INBOX_SECRET` is the panel password (32+ characters).

**Pages.**
- `/` Overview: messages per day for 30 days, counts by status, median time to read and to reply, the newest three messages, a seven-day site pulse.
- `/messages` Triage: status tabs, search, 50 per page, full message with reply, read, replied, archive and delete; `j`/`k`/`Enter`/`r`/`e` shortcuts; CSV export of the current filter.
- `/pulse` Site analytics: views and unique visitors per day, referrers, countries, time on page, scroll depth, how far down the page visitors get, resume and email clicks.
- `/health` Database latency and migration version, notification backlog with a retry button, env checklist (set or missing, never values), deploy commit and region.

**Cron.** `vercel.json` schedules `GET /api/cron` daily (Hobby allows one). It prunes page views older than 90 days and old sign-in attempts, and retries pending email notifications. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically.

**Pulse privacy.** No cookies, no local storage and no stored IP addresses: a visitor is an HMAC of IP and user agent keyed with a random salt that is generated each day and deleted when the day ends, so visits cannot be linked across days, not even by the owner. Browsers that send Do Not Track or Global Privacy Control send nothing at all, and the admin host is never counted. Rows are deleted after 90 days.

**Local.** Add `ADMIN_HOST=admin.localhost` to `.env.local`, run `npm run db:dev`, `npm run db:migrate`, `npm run dev`, and open `http://admin.localhost:3000`. `PULSE_DEV=1` records your own local page views; `npm run db:prune` applies retention by hand.
