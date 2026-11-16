# Portfolio refinement plan — November 2026

Planning session (Fable) output. Execution runs in four Opus sessions, one per task type,
each in its own worktree and branch, each using several subagents. This file is the
shared contract: goals, the bar, file ownership, and what "done" means per session.

## The bar

A senior engineer or a founder opens mehulgupta.me and, within a minute, is convinced
the person behind it has shipped real systems and thinks clearly. Everything on the page
either proves that or gets out of the way. Nothing decorative that does not earn its
place. No fake numbers, no claims without a source.

## Hard constraints

- Free resources only: Vercel Hobby, Neon free tier, Resend free tier. Nothing paid, ever.
- Nothing picked up from outside: no UI libraries, no form services, no comment widgets.
  Google fonts via `next/font` are self-hosted at build and are fine.
- Facts in `lib/content/*.ts` must trace to the resume, the Sahayogi One task document,
  the Alpha Academy codebase, or something Mehul said. Anything else is marked
  `[CONFIRM: …]` and listed for Mehul, never invented.
- `prefers-reduced-motion` and no-JS fallbacks stay intact for every interaction.
- Every session verifies in the browser (`preview_start` → `portfolio-dev`) at desktop
  and 375px, runs `npm run lint` and `npm run build`, and pushes a branch. No `gh` CLI
  on this machine, so sessions report the branch and a GitHub compare URL; Mehul opens PRs.

## State at planning time

- `main` = `origin/main` @ `2f49b3f` (PRs 1–4 merged): Client Work section (Alpha
  Academy) is live with five screen-recorded walkthroughs (28 MB of MP4 in `public/`).
- Third-party pieces found: **Web3Forms** (contact form delivery, key in
  `NEXT_PUBLIC_WEB3FORMS_KEY`) and **Lenis** (smooth scroll). Nothing else.
- Bugs seen on the live site: jumping to a section from the nav (e.g. `#client-work`)
  shows an empty screen until the visitor scrolls, because `Reveal` elements already in
  the viewport are never revealed. Footer says "Last updated September 2026".
- Weak spots: the contact form is gated behind a slingshot mini-game ("skip the game"
  link is the tell); four CTAs in the hero; several section titles repeat their label
  ("Experience / Experience"); the `[DRAFT]` ownership line on Client Work; a lot of
  toys (sheet sketch, lanyard card, pin-board swing, slingshot) competing for attention.

## Sessions and file ownership

Four sessions run in parallel. Each owns a disjoint set of files; nobody edits another
session's files. Shared files have a rule.

| Session | Branch | Owns |
|---|---|---|
| A. Own contact backend | `feat/own-contact-backend` | `app/api/**`, `app/inbox/**`, `lib/db/**`, `lib/contact/**`, `scripts/db-*.mjs`, `components/sections/Contact.tsx`, `ContactAirmail.tsx`, `components/ui/ContactDialog.tsx`, `app/styles/contact.css`, `.env.example`, `docs/contact-backend.md`, `package.json` (new deps only) |
| B. Client Work refinement | `feat/client-work-refine` | `components/sections/ClientWork.tsx`, `Walkthrough.tsx`, `components/ui/CountUp.tsx`, `lib/content/client-work.ts`, `public/client-work/**`, `app/styles/client-work.css` (moved out of `globals.css`) |
| C. UI refinement | `feat/ui-refine` | Everything else under `components/**`, `app/globals.css` (except the client-work block, which B moves out), `app/layout.tsx`, `app/page.tsx`, `lib/motion/**`, `lib/smooth-scroll.ts`, `lib/content/sections.ts` |
| D. Writeup refinement | `feat/writeup-refine` | String values in `lib/content/{profile,experience,milestones,research,roadmap,skills}.ts` (no type or shape changes), `README.md` |

Shared-file rules:
- `app/globals.css`: C owns it. A and B add one `@import "./styles/<name>.css";` line
  each at the top and keep their own styles in that file.
- `lib/smooth-scroll.ts`: C may replace Lenis, but must keep `pauseSmoothScroll()` /
  `resumeSmoothScroll()` exported with the same signatures, because A's dialog calls them.
- `lib/content/*.ts`: D edits copy; C and B do not change copy strings outside their files.
- `package.json`: A may add a Postgres driver (and dev-only PGlite). C may remove Lenis.
  Nobody else adds dependencies.

## A. Own contact backend (replace Web3Forms)

Decision: Neon Postgres (free tier) as the store, a Next.js Route Handler on Vercel as
the API, a self-built `/inbox` page as the reading surface, Resend (free tier) as a
best-effort email notification. The database row is the source of truth; email is a
convenience.

- Driver: `postgres` (postgres.js) with a plain `DATABASE_URL`, so the same code runs
  against Neon's pooled URL in production and a local Postgres in development. Plain SQL
  migrations in `lib/db/migrations/*.sql` with a small `scripts/db-migrate.mjs`. No ORM.
- Local dev without an account: `@electric-sql/pglite` + `pglite-socket` as a dev
  dependency behind `scripts/db-dev.mjs`, or Docker Postgres if present. Either way
  `npm run db:dev` gives a `DATABASE_URL` in one command.
- Schema: `messages(id, created_at, name, email, message, ip_hash, user_agent, status,
  notified_at)`. Rate limiting counts rows by `ip_hash` in a window; no Redis.
- Abuse controls, all self-built: honeypot, minimum fill time, size limits, Origin/Referer
  check, per-IP and per-email windows, constant-time secret compare on the inbox.
- `/inbox`: one secret (`INBOX_SECRET`) → signed HttpOnly cookie; list, mark read,
  reply via `mailto:`. Styled in the Build Log system. `noindex`.
- Missing env in a build → the form says so and shows the email address (same pattern
  the Web3Forms version used). Never a form that cannot work.
- Contact UI: the form moves inline onto the page; the slingshot game goes unless the
  session can make it a non-gating flourish that a senior reviewer would respect.
- Done: Web3Forms gone from code and env; submit → row in DB → email to Mehul →
  visible in `/inbox`; lint, build, 375px check; `docs/contact-backend.md` explains setup
  (Neon project, Resend key, Vercel env vars) in ten lines.

## B. Client Work refinement

The section a founder will read most carefully. Content and presentation together.

- Writeup: tighten every `detail` and `log` line in `lib/content/client-work.ts` so each
  step states a decision and why; cut repetition between steps ("the quiz published
  minutes ago" appears twice); make `decisions[]` read like an engineering design review
  (problem → choice → consequence → file); resolve the `[DRAFT]` ownership line into a
  `[CONFIRM]` item for Mehul rather than leaving a draft on the page.
- Presentation: fix anything that undercuts credibility (the count-up on "31 tables ·
  13 migrations" only animates one number; the trace panel's minimum height on phones;
  tab overflow on narrow screens). Only the active video should load. Posters should be
  real first frames. Consider a short "what I would do differently" block — honesty reads
  as seniority.
- Assets: 28 MB of MP4 is heavy for a free-tier origin. Re-encode if a tool is
  available (no ffmpeg on this machine; `npx` tools are acceptable), otherwise lazy-load
  strictly and document the sizes.
- Move the client-work CSS block from `globals.css` into `app/styles/client-work.css`.
- Done: a reviewer can read the section top to bottom in four minutes and come away with
  the architecture, three concrete engineering decisions, and no doubt about what Mehul
  personally did.

## C. UI refinement and own smooth scroll

- Fix the reveal-on-anchor bug first: elements already in view on load / hashchange /
  nav click must reveal immediately.
- Audit every interaction against the bar and keep only what earns its place. Default
  recommendation: keep the sheet sketch and the lanyard ID card (they are craft), make
  the pin-board swing subtler, and let A remove the slingshot. Remove anything that
  delays reading.
- Replace Lenis with a self-written smooth scroll (`lib/motion/smooth-scroll.ts`,
  wheel-only lerp, native on touch, off under reduced motion, pausable) or drop smooth
  scrolling altogether if the native result is better. Keep the pause/resume API.
- Typography and rhythm pass: section titles that repeat their label, heading sizes,
  the four hero CTAs (two is enough), header nav on phones, footer.
- Performance: measure first-load JS before and after; nothing regresses.
- Done: no third-party runtime component remains; Lighthouse-level hygiene (no layout
  shift, no console errors); every section lands cleanly from the nav; 375px and 1440px
  screenshots of every section attached to the handoff.

## D. Writeup refinement

- Rewrite in Mehul's voice: plain, specific, technical. No marketing adjectives, no
  "passionate", no em-dash habits. Every bullet names what was built, how, and what it
  proves. Apply the `unslop` discipline.
- Experience: the Sahayogi payroll bullets should read as an engineer's account (design
  first, schema, API contracts, review, QA) with the stack where known. RBH likewise.
- Milestones: keep the story form, cut repetition with Experience, keep dates exact.
- Research, skills notes, roadmap `now` (stale: September 2026), footer date.
- README: reflect the new sections and remove the "if you ever add a contact form"
  paragraph, since A is adding one (A documents setup in `docs/contact-backend.md`).
- Output a `[CONFIRM]` list for Mehul of every line that needs a fact he has not given.
- Done: all content files reread end to end with no filler left; confirm list delivered.

## After the sessions

Merge order: D (copy only) → C → B → A, resolving the two known shared-file touch
points (`globals.css` imports, `package.json`). Then a full visual pass on the merged
result, `npm run build`, and deploy from `main`. Vercel env vars to add: `DATABASE_URL`,
`RESEND_API_KEY`, `INBOX_SECRET`, `NEXT_PUBLIC_SITE_URL`. Remove
`NEXT_PUBLIC_WEB3FORMS_KEY`.
