# Review round 1: mehulgupta.me at `656ee25`

Reviewed 2026-11-16/17 on `main` @ `656ee25` (local dev + production build) and the deployed site https://mehulgupta.me (which has no backend env vars). Five angles, six reviewers, run in parallel. Screenshots: `docs/reviews/r1-shots/` (prefixes `founder-`, `a11y-`, `motion-`). Nothing in the repo other than `docs/reviews/` was changed.

Method notes: reviewers drove headless Chrome 157 (playwright-core); Lighthouse 12.2.1 ran against the deployed site. Facts about the Alpha Academy codebase were checked by the copy reviewer against `/Users/mehulgupta/Desktop/Alphaa/Alpha-academy @ 6ec9efd`. The Sahayogi One task document could not be opened, so claims that rest on it are marked unverified. I re-checked the dead-CSS list, the README Lenis line, the unlayered `:focus-visible` rule, `npm test` (45/45) and the source-only lint (clean) myself. Items marked "reasoned" below were not observed empirically.

## 1. Scorecard

| Angle | Score | One line |
|---|---|---|
| Founder read-through | **6** | Client Work alone meets the bar; the hero states instead of proves, the one CTA lands on a panel that says the form "is not configured on this build", and the lower half repeats itself. |
| Correctness, a11y, perf (a11y 6, motion 7) | **6.5** | Excellent foundations (reduced motion, no-JS, deep links, tablist ARIA, Lighthouse 100 on desktop) undercut by focus loss in the walkthrough, a global rule that kills the designed focus styles, and dead controls without JS. |
| Security of the new backend | **7** | No auth bypass, injection or leak; three unauthenticated write paths are unbounded against a free tier shared with Alpha Academy, and no security headers at all. |
| Code quality | **7** | Careful, typed, why-comments; held back by ~195 lines of dead CSS, a parked smooth-scroll chain, copied helpers, and no tests on the riskiest logic. |
| Copy and facts | **6** | Plain, specific, no em-dashes or marketing adjectives; but a wrong test count, a signed-link claim contradicted on the same page, and personal identifiers published against the files' own rules. |
| **Overall (30/25/20/15/10)** | **6.5** | `0.30×6 + 0.25×6.5 + 0.20×7 + 0.15×7 + 0.10×6 = 6.475`. Solid with visible rough edges; one section is already excellent. |

Score justifications (one paragraph each):

- **Founder 6.** A founder who reaches Client Work wants the interview: ownership is explicit, six decisions each carry problem/choice/result/file, and "what I'd do differently" reads as seniority. But in the first 10 seconds the hero gives a claim, not proof (the proof sits in a grey paragraph cut by the fold, both buttons are below the fold at 1440×900), the only CTA leads to developer-facing "not configured" text, Client Work has code counts but no sign anyone uses the system, Skills hides its evidence behind hover, and ~1,100 words of Timeline and Education restate earlier sections. Below 7 because a senior reviewer sees one feature that looks broken.
- **Correctness/a11y/perf 6.5.** Lighthouse is 100/100/100/100 on desktop and 94-95/100/100/100 on mobile, there are zero console errors, CLS is ~0, only the active video loads, and the reveal and stuck-pause bugs are fixed. Against that: keyboard focus drops to `<body>` in the walkthrough, an unlayered `:focus-visible` rule silently overrides every Tailwind focus utility, the nav focus ring is clipped below 1024 px, Play is dead when autoplay is refused, the no-JS page shows a dead widget above its fallback, and every cold deep link smooth-scrolls ~9,000 px for 1.5 s.
- **Security 7.** SQL is tagged templates throughout, comparisons are constant-time, sessions are HMAC-signed with server-side expiry, the CSRF model is right for the same-site admin/public split, nothing leaks into responses. It loses points for three unauthenticated endpoints that can write without a global bound into the Neon project shared with a production app, no CSP/frame/nosniff headers on either host, and sign-out that cannot revoke a session.
- **Code quality 7.** The application code is typed (no `any`, no `@ts-ignore`), validates every boundary, and explains tradeoffs. Four parallel sessions left residue nobody cleaned after the merge: dead CSS, a smooth-scroll module that cannot run, a README that names Lenis, comments citing deleted files, `npm run lint` failing from a clean checkout once agent worktrees exist, and helpers copied between routes that have already drifted.
- **Copy 6.** The prose is well above the usual portfolio and almost every checkable fact is exact. It is held down by claims that are wrong or untraceable: "43 integration test files" (43 is all Vitest files), "60-second" signed links contradicted by the page's own 300 s trace line, an enrolment number, roll number, blood group and a phone number (in the linked resume PDF) that the content headers say are left out on purpose.

Counts: **4 blockers, 18 majors, 40 minors** (detail below; some minors are grouped).

---

## 2. Blockers

### B1 The live Contact section says "The form is not configured on this build."
- **Where:** https://mehulgupta.me/#contact at 1440 and 375; `components/sections/ContactEmailNote.tsx:3`, `components/sections/Contact.tsx:43-60`, `lib/contact/config.ts:10-12` (also needs `IP_HASH_SALT`).
- **Evidence:** the left panel reads "Send a message" then "The form is not configured on this build. Email me at …". The hero's "Get in touch" leads here. `curl -X POST https://mehulgupta.me/api/contact -H 'content-type: application/json' -d '{}'` returns 503 `{"ok":false,"code":"unconfigured"}`. The address appears twice within ~150 px. Screenshots: `founder-1440-09-contact-a.png`, `founder-375-09-contact-a.png`, `a11y-deeplink-prod-1440-contact.png`, `motion-prod-js-contact-not-configured.png`.
- **Fix:** (1) ops: set `DATABASE_URL`, `IP_HASH_SALT` (and the rest, see `docs/contact-backend.md`) on Vercel and redeploy, because the check runs at prerender; (2) copy: when unconfigured render no "Send a message" heading and no reason text, let "Reach me directly" take the width; runtime failure copy "The form is offline right now. Email me instead."
- **Effort:** S. **Found by:** founder (F-1), a11y (A-1), motion (M-6), copy (C-2).

### B2 Two Client Work claims are wrong or contradicted on the same page
- **Where:** `lib/content/client-work.ts:35`, `:95`, `lib/content/skills.ts:56` (test count); `client-work.ts:46`, `:78-80` vs `:469` (signed links).
- **Evidence:** "43 integration test files" / "43 Vitest integration files run every route against a migrated database". 43 is the count of all Vitest files (20 `test/**` + 23 `src/**`); at least 11 import no app, DB or helper and are pure unit tests (about 32 are integration by import grep). "Run every route" is unmeasured. The page also says "60-second presigned URLs" while its parent-flow trace says `presignGet(fileKey, 300 s)`; code: homework and library use 60, report cards use 300 (`api/src/modules/reports/index.ts:78,260`).
- **Fix:** fact cell `{ value: 43, label: "Vitest test files", note: "API tests run against Postgres in PGlite" }`; decision text "43 Vitest files: unit tests for the rules and maths, and integration tests that run the API routes against a migrated database in PGlite"; skill note "43 Vitest files at Alpha Academy, Playwright on its public site". Signed links: "short-lived presigned URLs issued after a scope check: 60 seconds for homework and library files, 5 minutes for report cards"; architecture note "private bucket · short-lived signed links". If Mehul wants "integration" next to a number, recount by hand.
- **Effort:** S. **Found by:** copy (C-1, C-3).

### B3 Personal identifiers are published against the content files' own rules
- **Where:** `lib/content/milestones.ts:63-64, 86-87, 108-109, 150-151`; `public/Mehul_Gupta_Resume.pdf`; headers `experience.ts:5-6`, `milestones.ts:11-12`, `profile.ts:26`.
- **Evidence:** the live timeline renders `Enrolment Number : E23CSEU1423` (three times), `Roll No. 28`, `Blood Group B+`, `Blood Group : B+ve`. `experience.ts` header: "Left out on purpose: … the enrollment number"; `milestones.ts` header: "no ID numbers"; `profile.ts:26`: "Phone deliberately omitted from the public site", yet the resume PDF linked from the header, footer and contact section prints `Mobile: +91-8950326179`. Screenshots: `founder-1440-07-revision-history.png`, `founder-375-07-revision-history-d.png`.
- **Fix:** delete the `fields` arrays from both card types (or keep one non-identifying line such as "Class of 2027"); publish a web copy of the resume without the phone number; correct the `milestones.ts` header to describe what the cards show.
- **Effort:** S (data and PDF); M if the lanyard is also replaced (see M13).
- **Found by:** copy (C-4), founder (F-6).

### B4 Dead CSS, a smooth-scroll chain that cannot run, and stale comments ship on `main`
- **Where:** `app/globals.css:670-766` (`.thread-dialog` with `@starting-style`, `::backdrop`, autofill and reduced-motion rules, `html[data-thread-open]`, `.lenis.lenis-stopped`), `:768-791` (`env-bob`, `tray-badge-pop`), `:819, 836-844` (`.stamp-now`, `.postmark`), `:903-931` (`tray-jolt`, `.landing-marker`, `miss-panel`), `:371-391, 601-613` (`.hero-roles`, `.role-slot`, no `role-cycle` generator), `:648-658` (`.connector-h`); `lib/smooth-scroll.ts`, `lib/motion/smooth-scroll.ts` (170 lines), `components/animation/SmoothScroll.tsx:16` (`SMOOTH_WHEEL = false`).
- **Evidence (confirmed by me):** each of `thread-dialog`, `data-thread-open`, `env-bob`, `tray-badge-pop`, `postmark`, `tray-jolt`, `landing-marker`, `miss-panel`, `stamp-now`, `hero-roles`, `role-slot`, `connector-h` appears in `globals.css` and in no `.ts`/`.tsx` under `app/`, `components/`, `lib/` (`stamp-now` is set only by `Stamp.tsx:26` and no caller passes `now`; `Research.tsx:26` is the only caller). `pauseSmoothScroll`/`resumeSmoothScroll` have no callers; `registerSmoothScroll` runs only behind `if (!SMOOTH_WHEEL) return`. Comments cite deleted `ContactAirmail.tsx`, `ContactDialog`, `PipelineSketch.tsx`, Lenis (`globals.css:753, 769, 794`; `smooth-scroll.ts:111`; `SmoothScroll.tsx:9` says "kept, tested" but no smooth-scroll test exists). ~195 CSS lines of the 1,093 are dead.
- **Fix:** delete those CSS blocks, the `now` prop and its sentence in `Stamp.tsx:7`, `lib/smooth-scroll.ts`, the `data-thread-open` branch, and either all of the smooth-scroll feature (component, engine, layout mount at `app/layout.tsx:95`) or keep the engine and say plainly it is disabled and untested. Git history keeps it. Fix the `:794` comment to point at `Ink.tsx`.
- **Effort:** S. **Found by:** quality (Q-1, Q-3, Q-15), motion (M-12), a11y (A-19).

---

## 3. Majors

### M1 The hero does not make the case in 10 seconds; its buttons are below the fold at 1440×900
- **Where:** `components/sections/Hero.tsx:34, 67, 74, 81, 112` (`lg:grid-rows-[auto_1fr] lg:items-stretch` leaves a ~130 px empty band under the name); 1440×900 and 375×812.
- **Evidence:** first 10 s gives the name, three role targets and a claim ("I build the systems businesses run on, and want to bring machine learning into them"). The proof (payroll module in production, a coaching institute's system built and still run alone) is in a 60-word grey paragraph the fold cuts at line 2. The hero is 1,256 px tall; both buttons sit at y≈1,027. The "Now …" strip restates titles and dates without linking to proof. Screenshots: `founder-1440-00-firstfold.png`, `founder-375-00-firstfold.png`.
- **Fix:** make the headline the evidence ("I built and run a six-role school portal in production, and shipped the payroll module at Sahayogi One"); move the ML ambition to one line below; remove the empty band so headline, paragraph and both buttons fit within 900 px; link the strip to proof (live site, manuscript status) or drop it.
- **Effort:** M. **Found by:** founder (F-2).

### M2 Client Work shows code counts but no evidence anyone uses the system
- **Where:** `lib/content/client-work.ts:32-35`; stats row at both widths.
- **Evidence:** the four tiles are roles, permissions, tables and test files. "Live in production" is asserted with no accounts, duration or outcome. Screenshot `founder-1440-04-client-work-a.png`.
- **Fix:** add one real usage line as a `[CONFIRM]` for Mehul (active accounts, months in production, records written) and swap the weakest tile (permissions) for it; if nothing can be shared, "in daily use by the institute since <month year>". Never invent a figure.
- **Effort:** S once facts exist. **Found by:** founder (F-3).

### M3 Walkthrough recordings are unreadable on phones; trace panel has dead space
- **Where:** `components/sections/Walkthrough.tsx`; 375 wide (smaller issue at 1440).
- **Evidence:** at 375 the video is 333×173 px and the portal UI inside is a few pixels tall; the trace panel shows three lines then ~110 px of empty box at both widths. Screenshots: `founder-375-04-client-work-b.png`, `-c.png`, `founder-1440-04-client-work-b.png`.
- **Fix:** below 640 px show each step as a readable still crop with its caption and play on tap/full screen; drop the trace panel `min-height` on narrow screens; consider a zoomed crop per step on desktop.
- **Effort:** M. **Found by:** founder (F-4).

### M4 Walkthrough keyboard and playback defects (focus loss, dead Play, dead no-JS widget)
- **Where:** `Walkthrough.tsx:503` (`{playing ? null : <button…>}`), `:382` (rail keyed by `item.title`), `:127, 164-169, 325` (`playing = (wantsPlay ?? motion) && inView`), `:266-418` vs `:413-415` (noscript).
- **Evidence:** (a) Tab to the overlay Play scrolls the video into view, autoplay starts, the overlay unmounts and `activeElement` becomes BODY (`walk2.mjs`, prod tab pass hits BODY at stop 16); keyboard-focused "Step 6 of 6" when the flow auto-advances rebuilds the rail and focus goes to BODY (`walk3.mjs`). WCAG 2.4.3 in the main proof section. (b) When the browser refuses the first `play()` (Low Power Mode, blocked autoplay), toolbar Play changes `wantsPlay` null→true but `playing` was already true so the effect never re-runs: three toolbar clicks, still `paused=true`; only the overlay works (`w3.mjs`, `motion-walk-autoplay-refused-toolbar-play-dead.png`). (c) With JS off the full interactive shell renders, controls do nothing, and the Faculty recording appears again in the noscript fallback; `#client-work` is 11,192 px tall (`motion-nojs-1440-walkthrough-dead-controls.png`).
- **Fix:** hold the tour while focus is inside `.walk` (like hover); keep the overlay mounted and `inert` while playing, moving focus to the play button if it had focus; key rail buttons by index and refocus the last button when the focused one vanishes; call `play()`/`pause()` directly in the toolbar handler and set `wantsPlay=false` on a rejected play; hide the shell with `html:not(.js) .walk-interactive { display: none }` (set a `js` class regardless of motion) or reuse the `<noscript><style>` trick from `Contact.tsx:52`.
- **Effort:** M. **Found by:** a11y (A-2), motion (M-1, M-5).

### M5 An unlayered global `:focus-visible` overrides every Tailwind focus utility; the nav ring is clipped
- **Where:** `app/globals.css:62-65`; `components/navigation/SiteHeader.tsx:141` (`overflow-x-auto`).
- **Evidence:** Tailwind v4 utilities live in `@layer utilities`; an unlayered rule beats them regardless of specificity. Result: `focus-visible:-outline-offset-4` on the play overlay computes `3px` and its ring shows only top and bottom fragments (`a11y-focus-walk-play-overlay-1440.png`); `outline-offset-0` on the rail also computes 3px; `focus:outline-none` on the success h4 has no effect, so a full-width blue box wraps "Message received." (`a11y-contact-success-1440.png`). Below 1024 px (and at 250-400 % zoom) nav links are 44 px in a 44 px scroller, so a 3 px offset ring has no room and only a left sliver survives (`a11y-focus-nav-375.png`).
- **Fix:** wrap the rule in `@layer base { :focus-visible { … } }` and re-check overlay, rail and headings; draw the nav ring inset (negative offset) below `lg` and add `scroll-padding-inline: 2.5rem` to the scroller.
- **Effort:** S. **Found by:** a11y (A-3, A-4).

### M6 Cold deep links smooth-scroll the whole page; deep-linked content can stay hidden on slow networks
- **Where:** `app/globals.css:44-48` (`html { scroll-behavior: smooth }`); `app/layout.tsx:89-93` (head script, 4 s failsafe), `lib/motion/reveal.ts`.
- **Evidence:** cold `/#education` goes 0→43→265→683→1849→3890→…→9057 (375: →17,967) over ~1.5 s, with JS on or off (native CSS), content fully visible only at ~1.8 s (`t4.mjs`, `dl2.mjs`). Separately, on throttled 3G (400 kbps, 300 ms RTT, 4× CPU) cold `/#experience` cards are in view at 3.7 s but stay invisible until the 4 s failsafe fires at 7.4 s (`t10.mjs`); with scripts blocked, hidden until exactly 4.0 s (`motion-scripts-blocked-experience-7s.png`).
- **Fix:** add a `smooth` class on `load` + one rAF in the head script and scope `scroll-behavior: smooth` to `html.smooth` (nav clicks stay smooth, deep links land instantly); add a small inline end-of-body script that reveals `.reveal` above `innerHeight*0.92` immediately and lets the React engine handle later mounts; lower the failsafe to ~2.5 s.
- **Effort:** S (scroll), M (early reveal). **Found by:** motion (M-2, M-3), a11y (A-7).

### M7 Timeline dims the text being read to ~2.3:1
- **Where:** `components/sections/RevisionTrack.tsx:20-41, 82-88` (`opacity-45` on inactive entries); applies with motion on at ≥1024 px.
- **Evidence:** `#939dac` at 45 % over `#0b0e13` ≈ 2.3:1 (AA needs 4.5:1). Scrolling in 60 px steps, 23 of 33 positions had a paragraph fully inside the 25-75 % band that was dimmed (`h4.mjs`). Screenshots `motion-timeline-dimmed-while-reading-1440.png`, `founder-1440-07-revision-history-a.png`.
- **Fix:** dim only the dot and period label, or keep inactive text at opacity ≥ 0.75, or mark an entry active while any part is inside the 30-70 % band.
- **Effort:** S. **Found by:** motion (M-4), founder (F-10).

### M8 The Timeline restates Experience and Research almost sentence for sentence
- **Where:** `lib/content/milestones.ts:135, 160, 177-178` vs `experience.ts:55-59, 70-74`, `research.ts:14-17`; `components/sections/RevisionTrack.tsx`.
- **Evidence:** 661 words (~2.9 min), 2,322 px tall at 1440 and 4,851 px at 375. Sahayogi: "I wrote the high-level and low-level design, the database schema and the API contracts first, got the senior team to approve them…" vs Experience "Designed the payroll and HR module before writing code: HLD, LLD, database schema and API contracts, approved by the senior team." SCADA and research sentences near-identical; the payroll module is stated in the hero, Experience, the timeline and four skill notes. Screenshots `founder-1440-07-revision-history.png`, `founder-375-07-revision-history-a..g.png`.
- **Fix:** let the timeline say what changed for him: RBH "My first internship, done remotely over the summer, building admin and customer screens for a SCADA product."; Sahayogi "In June 2026 I joined Sahayogi One as a developer trainee on the core product team. It was the first place where the design had to be approved before I could write code, and the first time something I built went through QA and into production. The module itself is under Experience."; research "In the same stretch I worked on research into predicting wheat yield from hyperspectral data. The manuscript went under review in April 2026." Aim under 200 words, or move below Education.
- **Effort:** M. **Found by:** founder (F-5), copy (C-8).

### M9 Skills: evidence hidden behind hover, 34 inert tab stops, and a "shipped" definition that no longer fits
- **Where:** `components/sections/SystemMapExplorer.tsx:14, 41, 76-93, 116`; `SystemMap.tsx:10`; `lib/content/skills.ts:2-3, 53-56, 66, 79, 89`.
- **Evidence:** the "where I used them" text appears only on hover (`founder-1440-06-system-map-hover.png`); touch still reads "Hover or focus a skill…" and the list is a 2,232 px column at 375. Tab stops 27-60 are chips whose Enter/Space do nothing and feed an `aria-hidden` readout; the filter only dims chips (dimmed chips stay focusable; the "N of M shown" count is not announced); `title` plus sr-only text reads the hint twice. Caption says "Shipped means used in production at work" but Fastify, Drizzle, Render, TypeScript, Auth and sessions and Vitest/Playwright are shipped on Alpha Academy (client work); Docker's note ("Part of the Sahayogi One stack.") and RBH RBAC ("screens at RBH") have no source showing production use.
- **Fix:** print the one-line evidence inline for Shipped and Research entries; collapse Learning entries to one sentence; make chips plain `<li>` (or one roving-tabindex composite); hide non-matching chips from AT when filtering and put the count in `role="status"`; drop `title`; "Select a skill to see where I used it."; caption "Shipped means it runs in production, at Sahayogi One or at Alpha Academy." (hint "used in a system running in production"); confirm or reword the Docker and RBH entries.
- **Effort:** M. **Found by:** founder (F-7, F-14), a11y (A-5), copy (C-7, C-13).

### M10 Education puts the weakest numbers in display type, CGPA in accent colour
- **Where:** `components/sections/Appendix.tsx:16, 19, 26-31` (`font-display text-2xl`, `index === 0 ? "text-accent"`).
- **Evidence:** "CGPA 7.79" is large accent blue, "77.8 %" and "90.8 %" large white; it is the only accent number below Client Work. Header stutters: `EDUCATION` / "Education and certifications" / h3 "Education". Screenshot `founder-1440-08-education.png`.
- **Fix:** show results at body size in `text-ink-dim`; drop Class X and XII from display type; title "Degree, school and certificates" or drop the first h3.
- **Effort:** S. **Found by:** founder (F-8), copy (C-10).

### M11 Three unauthenticated endpoints can write without a global bound into the Neon project shared with Alpha Academy
- **Where:** `app/api/admin/session/route.ts:100-113` + `lib/admin/login-attempts.ts:13-15` (S-1); `app/api/pulse/route.ts:29, 131-137` + `lib/pulse/validate.ts:37-43` (S-2); `app/api/contact/route.ts:18-19, 85-89` (S-3).
- **Evidence:** every POST to `/api/admin/session`, including locked-out ones, inserts a `login_attempts` row (rows live 24-48 h); about 2 M requests in that window approach Neon's free 0.5 GB (reasoned; Vercel Hobby invocations likely trip first). Pulse allows 240 views/hour/IP, ≈518,400 rows per IP in the 90-day window (≈0.5-1.4 GB by estimate), leave beacons are unlimited, no global cap. Contact: effective 5/hour/IP because the per-email limit (3/day) is defeated by varying the address, so one IP can store and email 120 messages/day, above Resend's free 100/day (reasoned). Blocker if Alpha Academy already uses more than about half of free storage (check the Neon console).
- **Fix:** stop recording once locked or cap per-bucket rows (~20) plus a global failures ceiling and in-route prune; pulse: global hourly/daily ceilings checked in the same round trip, `perSource` to ~60, limit leaves (only update recent rows, counter column), trim stored path to 100 and validate sections against known ids; contact: per-IP daily window (10), global window (30/hour, 100/day) returning the same 429, digest emails from cron under load; longer term a signed server-issued form token.
- **Effort:** S (S-1), M (S-2), S/M (S-3). **Found by:** security (S-1, S-2, S-3).

### M12 No security headers on either host
- **Where:** `next.config.ts:3-9`, `vercel.json:1-4`, `proxy.ts:25-31`.
- **Evidence:** production `GET /` returns only `strict-transport-security: max-age=63072000`; no CSP, `X-Frame-Options`/`frame-ancestors`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. The admin panel can be framed by any same-site page. No direct exploit found; missing standard control, and a header scanner grades a portfolio about engineering poorly.
- **Fix:** `headers()` for all paths: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, `Permissions-Policy`, HSTS with `includeSubDomains`; in `rewriteToAdmin` a strict CSP (`default-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'none'; object-src 'none'`, nonce for Next inline scripts), `Referrer-Policy: no-referrer`, `Cache-Control: no-store`.
- **Effort:** S (static + frame-ancestors), M (nonce CSP). **Found by:** security (S-4).

### M13 The ID-card lanyard publishes data and is the clearest "toy" on the page
- **Where:** `components/sections/IdCard.tsx`, `RevisionTrack.tsx:52-59, 110-112`, `lib/motion/use-lanyard.ts:300-338`.
- **Evidence:** on desktop a card swings as you scroll. Under reduced motion or without JS at 1440 there are 0 cards and the right column is empty (6 cards at 375). The pinned card is read aloud as noise ("…Roll No., 28, Blood Group, B+, Principal Sign.") before the first milestone (`a11y` tree). Physics runs at 60 fps for ~10 s after any scroll even 6,000 px away (180 rAF/3 s; 349 ms task per 3 s, `h2.mjs`, `h3.mjs`); `RevisionTrack`'s own scroll subscriber measures every entry each frame from anywhere.
- **Fix:** once B3 removes the identifiers, replace the lanyard with a small static logo or text per entry (or keep with `aria-hidden` on the pinned card, a static card per entry when `!enabled`, an IntersectionObserver gate on the physics loop and the scroll subscriber).
- **Effort:** M. **Found by:** founder (F-6), motion (M-7, M-8), a11y (A-8).

### M14 The 83 KB poster and the videos load early and revalidate on every view
- **Where:** `components/sections/Walkthrough.tsx:483-492`; Vercel headers for `/client-work/*.mp4`.
- **Evidence:** `walk-faculty.jpg` (83.4 KB, a raw 1600×832 JPEG in `/public`) loads at 137 ms with the critical path on every cold load, 19.5 % of the 428 KB pre-scroll transfer, while Client Work starts at y=2132 (1440) / 2908 (375) (`net.mjs`). It is also Lighthouse's only image opportunity ("modern formats", 50 KiB). mp4s are 1.7-6.0 MB with `cache-control: max-age=0, must-revalidate`; autoplay pulls `bytes=0-` with no `saveData` check (2.35 MB at ~y=2250).
- **Fix:** set the poster only when the existing `near` observer fires, or render via `next/image` (≈20-30 KB AVIF); serve mp4s with `max-age=31536000, immutable` and versioned filenames; skip autoplay on `navigator.connection?.saveData`; re-encode `website.mp4` (6 MB) smaller.
- **Effort:** S. **Found by:** a11y (A-6), motion (M-13).

### M15 README, lint script and docs do not match reality
- **Where:** `README.md:41` ("Lenis handles smooth scrolling"; Lenis not in `package.json`), `README.md:5-9, 48-52`; `eslint.config.mjs:9-15`; `.env.example` and `lib/admin/health.ts:71` (`IP_HASH_SALT`); `docs/contact-backend.md`.
- **Evidence:** README line confirmed by me; footer links to the source. `npm run lint` reported by the quality reviewer to exit 1 with 57,578 problems, all under `.claude/worktrees/**` (ESLint ignores `.gitignore`); source-only `npx eslint app components lib scripts proxy.ts` exits 0 (I re-ran: clean). `.env.example` and the health page say `IP_HASH_SALT` is used for "daily pulse visitor ids" but pulse uses a random per-day salt in `pulse_salts`; it is used for contact rate limits and admin sign-in throttling. README omits `npm test`, `db:*`, the admin docs and cron; `contact-backend.md` says the form checks only `DATABASE_URL` (it also needs `IP_HASH_SALT`) and that `npm test` runs two suites (four exist); `PGLITE_PORT` and `scripts/db-seed-pulse.mjs` are undocumented.
- **Fix:** replace the README line ("Scrolling is native; anchors use `scroll-margin-top`") and add a Commands and Docs block; add `".claude/**"`, `".pglite/**"` to `globalIgnores`; correct the `IP_HASH_SALT` purpose to "contact rate limits and admin sign-in throttling"; fix the two `contact-backend.md` sentences; add `db:seed-pulse` script; note `PGLITE_PORT`; scope Production-only secrets in `docs/contact-backend.md:24` (S-14).
- **Effort:** S. **Found by:** quality (Q-2, Q-4, Q-8, Q-17), copy (C-24), security (S-14).

### M16 Copy: untraceable claims, a school/date conflict, and filler in the contact section
- **Where:** `lib/content/experience.ts:53`, `milestones.ts:58, 68-69, 178`, `skills.ts:57, 70, 90`, `components/sections/RevisionHistory.tsx:10`, `Contact.tsx:24, 34-36`, `ContactForm.tsx:216`, `client-work.ts:102-106`.
- **Evidence:** "Core product team at a Noida startup" ("startup" not in the resume); "Since September I have been working on the company's WhatsApp integration" (no start month in the resume); "my first developer job" vs a role described as a six-month university placement; the `[CONFIRM]` on the hindsight block is still open yet both lines render as fact; "usually within two days" has no source; timeline pairs Dyal Singh Public School with 2008-2023 while Education says Class XII was at Greenland Public School; "Let's build together" / "Have an idea worth building, a problem worth solving… I'm always up for a conversation with people who make things" is a triad with two "worth"s and no ask.
- **Fix:** confirm or reword each (safe wording: "From school in Karnal to a product team in Noida"); add one clause for the school move [CONFIRM years]; contact title "Email me, or write here" and intro "I am looking for backend, full-stack and AI/ML engineering roles from 2027. If you are hiring, or want to ask how something on this page was built, write to me. I reply within two days." [CONFIRM "from 2027" and the reply time]; mark every line lacking a source with `[CONFIRM]` in the content files.
- **Effort:** S. **Found by:** copy (C-5, C-6, C-11), founder (F-12).

### M17 Client Work repeats itself inside the section
- **Where:** `lib/content/client-work.ts:104-105, 111, 303, 550, 651, 26, 32, 548, 45, 60-65, 197, 234, 516`; `components/sections/ClientWork.tsx:47-49, 102-104`.
- **Evidence:** adjacent boxes say the Render deploy watchdog twice ("What I'd do differently" and Deploys); the flatten-segments explanation appears in full twice; "the server works out the role" ends two items; "One login" three times; "audit in the same transaction" five times; two buttons to the same URL ("Visit live site", "Live site"). Screenshot `founder-375-04-client-work-i.png`.
- **Fix:** delete `client-work.ts:111`; shorten `:104` to "The static export needs a post-build script to make client-side navigation work (see the Website walkthrough). I'd test navigation on the static host before committing to an export, not after."; change `:303` to "The student signs in on the same page the teacher uses. A student account carries a single permission: booking backup classes."; drop the audit clause from `:197` and `:516`; remove the second live-site button.
- **Effort:** S. **Found by:** copy (C-9), founder (F-13).

### M18 Request helpers and the notification path are copied between routes and have drifted; the riskiest logic has no tests
- **Where:** `app/api/contact/route.ts:38-65, 102-109` vs `app/api/pulse/route.ts:92-119`; `app/api/admin/**` (`text()`, `readForm`); `app/api/cron/route.ts:19, 28-37` vs `lib/admin/auth.ts:44`, `lib/admin/health.ts:17, 86-92`; `lib/admin/maintenance.ts:21, 48-49`; `lib/contact/notify.ts:77`; untested: `lib/admin/auth.ts:56-87`, `lib/contact/abuse.ts:56-63, 91-96`, `app/admin/messages/url.ts:79-95`, `proxy.ts`, `app/api/pulse/route.ts:57-80`, `lib/db/messages.ts` cursor codec, `lib/pulse/visitor.ts`.
- **Evidence:** `readBody` is identical in contact and pulse; `parseJson`, `isJson`/`hasAcceptedType`, `sha256`, `hostnameOf` (only pulse handles bracketed IPv6) and `run`/`probe` are duplicated. The contact route sends `inboxUrl: ${siteUrl}/inbox` (the old path, reachable only via the 308 in `proxy.ts:34-38`) while the retry path uses `adminUrl("/messages")`; `isResendConfigured()` trims the key but `sendNotification` does not. Error shapes vary across four routes (contact JSON `{ok,code,message}`, pulse always 204, cron `{ok,error}`, admin text/plain and 303). 45 tests in 4 files (csv, notify, contact/validate, pulse/validate) cover none of: session signing (valid, tampered, expired, malformed), the IPv6 /64 parser, the open-redirect guard whose comment lists hostile inputs but no test checks them, proxy host routing. Most of this sits in `import "server-only"` modules that plain `node --test` cannot import.
- **Fix:** `lib/http/request.ts` (`readBodyLimited`, `parseJsonSafe`, `contentTypeIs`, `readFormSafe`, `hostnameOf`), `lib/http/response.ts` (`textResponse`), one `constantTimeEquals`, export `probe`; one `notifyOwner(message)` using `adminUrl("/messages")` and a single trimmed `resendApiKey()`; one JSON error shape `{ok:false, code, message}` plus a short "Response contract" table in the docs; move pure code out of server-only modules (`lib/messages/model.ts`, `lib/http/ip.ts`) and add the tests listed above.
- **Effort:** M (helpers + notify), M (tests). **Found by:** quality (Q-5, Q-6, Q-7, Q-10, Q-11).

(Walkthrough.tsx is 709 lines with a ~320-line component, 8 `useState`, 6 refs, two IntersectionObservers on one node and 26 hooks; Q-9 proposes `useWalkthroughPlayback()`, a merged observer hook, and `walkthrough/*.tsx` for `VideoStage`, `ImageStage`, `Trace`. M effort. Listed as a major by the quality reviewer; it is best done together with M3 and M4.)

---

## 4. Minors

IDs are reviewer references. Each has file, evidence and fix in the reviewer's wording; summarized here.

**Founder / design**
- **m1 (F-9) Decorative styling in Research and Certifications.** `Research.tsx:26` rotated "Manuscript under review" stamp, `PinBoard.tsx:10-17` tilted cards with push-pins, the "Yield prediction / the output" node is filler. Fix: plain status tag, flat two-column certificate list with verify links, drop the node. S.
- **m2 (F-11) Surname at 1.6:1.** `globals.css:367-368` `.hero-name span:last-child { color: var(--color-line-bright) }` is `#2e3745` on `#0b0e13`. Fix: `--color-ink-faint` or `--color-ink-dim` (≥5:1), keep the two-tone look. S.
- **m3 (F-15) Mobile header clips nav links under Resume.** `SiteHeader.tsx:141`, `globals.css:939-955`: a sliver of "R", "SK", "EDUCATI", "IMELINE". Fix: end the fade before the button, add a left fade after scrolling. S.
- **m4 (F-16) Experience has no scale facts; RBH thin.** `experience.ts:57, 74`. Fix: one scale fact per role as `[CONFIRM]`, add the RBH stack, merge the access-levels bullet into the build bullet. S.
- **m5 (F-17) SECURITY tab has no play glyph** (`Walkthrough.tsx:290`); use one marker or a distinct "frames" icon. S.

**Accessibility**
- **m6 (A-9) Nav links do not move focus to the section.** After Enter on a nav link `activeElement` is BODY. Fix: `tabIndex={-1}` on sections or focus the h2 on `hashchange`. S.
- **m7 (A-10) Reflow fails at 320 px** (`Walkthrough.tsx:637`, `scrollWidth` 331; `requirePermission('attendance.mark') ✓` overflows by 31 px). Fix: `[overflow-wrap:anywhere]` on trace text. S.
- **m8 (A-11) Focus can land on content still at opacity 0** (15 stops at a 120 ms dwell). Fix: `.js-motion .reveal:focus-within{opacity:1;transform:none;transition:none}`. S.
- **m9 (A-12) Copy button is 63×35 at 375 and silent** (`CopyButton.tsx:25`). Fix: `min-h-11 sm:min-h-10`, sr-only `role="status"`, visible failure state. S.
- **m10 (A-13) Inline mailto links distinguished by colour alone** (`ContactEmailNote.tsx:28`, `ContactForm.tsx:94`; the only axe violation, 1.14:1). Fix: underline. S.
- **m11 (A-14) Contact field borders are 1.34:1** (`#232a35` on `#0b0e13`; WCAG 1.4.11 wants 3:1). Fix: `#5a6575` or a `bg-surface` fill. S.
- **m12 (A-15) Admin: focus resets to BODY after each round-trip**; `role="alert"` present at load so likely not announced (`SignInForm.tsx:52`, `MessageActions.tsx`, `TriageKeys.tsx`). Fix: `autoFocus` the secret on error; focus the detail h2 or Notice after navigation. S.
- **m13 (A-22) Landmark polish.** The trace panel is an unlabelled `<aside>` in `<main>` (`Walkthrough.tsx:569`); no section has an accessible name. Fix: `<div>`, `aria-labelledby` on sections. S.

**Motion**
- **m14 (M-9) Walkthrough ignores hidden tabs; image steps restart after scrolling back** (`Walkthrough.tsx:127-137, 361-367`). Fix: `&& pageVisible`; keep the progress span mounted and pause with `data-paused`. S.
- **m15 (M-10) "Server trace" dot blinks forever, even paused and off-screen** (`Walkthrough.tsx:614`, `client-work.css:141-143`). Fix: `active && isPlaying`. S.
- **m16 (M-11) Layout-property animations** in `client-work.css:99-103` (`left`/`top` on `.walk-cursor`), `globals.css:586-594` (`top`), `:283-287` (`background-size`), `SiteHeader.tsx:187` (`height`). CLS measured 0. Fix: transform equivalents. S.

**Performance**
- **m17 (A-18) HTML is 268 KB raw / 42 KB gzip.** 88 KB RSC payload, 38.9 KB (≈6.9 KB gz) `<noscript>` walkthrough fallback, 87 KB of `class` attributes. Fix: slim the noscript fallback to summaries, step titles and mp4 links. S.
- **m18 (A-19) Desktop-only code ships to phones.** IdCard and lanyard physics (~36 KB source), SheetSketch (14 KB), disabled `SmoothScroll`. First-load JS is 179 KB gzip across 10 module scripts; the 215 KB / 11-chunk figure includes `0cz1d0mv5g_q7.js`, a 39.5 KB gz `noModule` polyfill chunk modern browsers do not fetch (I confirmed `noModule` in the HTML). Fix: `next/dynamic` for `IdCard`/`SheetSketch` behind their gates, delete `SmoothScroll`. M.
- **m19 (A-20) Five fonts preloaded at High priority (88 KB, 21 % of initial transfer)** (`app/layout.tsx:9-29`). Fix: preload only Condensed 700, Sans 400, Mono 400; `preload:false` for the rest. S.
- **m20 (A-16) Icon 404s.** Prod `/favicon.ico` 404; admin host `/icon?…` rewritten to `/admin/icon` 404 (`proxy.ts:19-30, 53`). Fix: let icon/OG/sitemap/manifest through the rewrite; add `favicon.ico`. S.
- **m21 (A-17) Edge metadata and redirects.** `/nope` 404 has title "Mehul Gupta", canonical `https://mehulgupta.me`, noindex; `/inbox` and `/admin` return a permanent 308 to `admin.mehulgupta.me`, which does not resolve yet (browsers cache 308). Fix: own 404 metadata ("Page not found", no canonical); 307 until the admin host exists; add a role to the home title. S.
- **m22 (A-23) OG image uses the default sans** (`app/opengraph-image.tsx`); pass IBM Plex Condensed 700 and Sans 400 `.ttf` to `ImageResponse`. S.

**Security (hardening, ordered by exploitability)**
- **m23 (S-5) Sign-out does not revoke; the password is the signing key.** `lib/admin/auth.ts:48-50, 62-68`: old cookie still returned 200 on the export after sign-out (valid ≤7 days). Fix: derive the key (`HMAC(INBOX_SECRET, "admin-session-v1")`), sign `expiry.sessionId`, keep a `sessions_valid_after` row bumped on sign-out (fall back to signature-only if the DB is down), `__Host-` cookie name, `SameSite=Strict`. M.
- **m24 (S-6) CSRF origin check trusts `request.url`** (`auth.ts:105-109`): outside Vercel `Origin: http://localhost:3000` passes on the admin host. Fix: compare only to `adminOrigin()` and reject `Sec-Fetch-Site` values other than `same-origin`/`none`. S.
- **m25 (S-7) Proxy matcher lets `/api/admin/messages/<id>.png` reach the handler on the public host** (`proxy.ts:53`, 401 instead of 404; no impact today). Fix: add `/api/admin/:path*`, `/admin/:path*`, `/inbox/:path*` to the matcher. S.
- **m26 (S-8) No query timeout.** `lib/db/client.ts:39-46`: each sequential query pays 10 s on an outage (sign-in ≈20 s, `/health` ≈30 s, derived). Fix: `ALTER ROLE portfolio_app SET statement_timeout='8s'`, `connect_timeout: 5`, stop `/health` after the first failed probe. S.
- **m27 (S-9) Contact route logs the whole DB error**, which can contain the submission (`app/api/contact/route.ts:167, 114`; `notify.ts:97`). Fix: log `errorClass(error)`. S.
- **m28 (S-10) `CRON_SECRET` has no minimum length** and the 503 says whether it is set (`app/api/cron/route.ts:41-45`). Fix: treat < 32 chars as unset, answer 401 in both cases. S.
- **m29 (S-11) `admin.mehulgupta.me` has a CNAME to Vercel but is not attached to the project** (TLS fails, `DEPLOYMENT_NOT_FOUND`; subdomain-takeover shape, probably blocked by Vercel's claim rules, unverified). Fix: add the domain to the project now or remove the CNAME. S.
- **m30 (S-12) Rate limits are count-then-insert** (25 concurrent POSTs → 6×200, 19×429 against a limit of 5). Fix: single conditional insert statement. S.
- **m31 (S-13) A filled honeypot silently discards a real person's message** (autofill of `website`; latency differs from the real path). Fix: rename the trap, store trapped rows as `spam` for 7 days. S/M.
- **m32 (S-15) Client IP from generic headers** (`lib/contact/abuse.ts:46-50`). Fix: on Vercel read `x-vercel-forwarded-for`/`x-real-ip`. S.
- **m33 (S-14) Docs put production secrets and DB on Preview deployments** (`docs/contact-backend.md:24`). Fix: Production-only, previews show the email fallback. S (already in M15).

**Code quality**
- **m34 (Q-12) Retention periods hard-coded in several places** (`pulse/route.ts:30`, `cron/route.ts:17`, `scripts/db-prune.mjs:12-13`, `maintenance.ts:16`, `OWNER_TIME_ZONE` twice). Fix: export constants. S.
- **m35 (Q-13) Duplicated status list and a repeated `includes` cast** (`lib/admin/stats.ts:37-42`, four `as readonly string[]` sites). Fix: import `messageStatuses`/`isMessageStatus`, one `isOneOf`. S.
- **m36 (Q-14) Shared style utilities skipped.** `ClientWork.tsx:30` hand-rolls padding instead of `sheet-section` (no longer matches `--section-pad-top`, which the scroll-margin calc at `globals.css:87-89` relies on); 15 exact `label-mono` equivalents and 41 near-variants; button recipe restated four times. S.
- **m37 (Q-16, Q-18, Q-19) Unused exports and naming:** `listMessages` (deprecated, no callers), unrendered `academicProjects`/`achievements`, `utcDay`, `readPath`, `UUID_PATTERN`, `HOLDER_SIDE`/`HOLDER_H`; camelCase vs UPPER_SNAKE module constants and mixed log prefixes; local `Stamp` and `Tag` shadow shared names; `health/page.tsx` (301 lines, 14 local components) and `globals.css` (split by feature after B4). S.
- **m38 Components over 250 lines (not separately filed):** `client-work.ts` 711 (content, fine), `Walkthrough.tsx` 709 (M18 note), `IdCard.tsx` 557 and `SheetSketch.tsx` 388 (optional splits), `use-lanyard.ts` 412 (cohesive), `health/page.tsx` 301.

**Copy**
- **m39 (C-12, C-20, C-21, C-22) Microcopy.** "That was quick. Give it a moment and send again." and "You have sent a few already…" blame the visitor (the limit is per IP hash); "I reply to anything real" implies the sender might not be; server and client error strings are two copies and already differ (`app/api/contact/route.ts:145, 155, 168` vs `use-contact-form.ts:24, 26, 28`); "…or email me directly. Or email mehulg2005@gmail.com" (rate-limit message repeats itself, A-21); admin "Nothing new. All caught up.", "fails / min", "manage it in the inbox"; the 404 title block speaks drawing-sheet ("Sheet · Not in this set"). Fix: single copy set (client's) with server returning codes only; "The form was sent too soon after the page loaded, which is how I filter bots. Wait a few seconds and send again."; "This network has sent several messages in a short time. Try again in an hour, or email me."; "It is in my inbox. I usually reply within two days."; "No unread messages."; "failures"; drop the 404 title block or "Status 404 / Address not found". S.
- **m40 (C-14, C-15, C-16, C-17, C-18, C-19, C-23) Consistency and staleness.** Postgres/PostgreSQL, zod/Zod, Next/Next.js, Super Admin/super admin, id/ID, login/sign in, clients/customers, "Live in production"; "AI-powered recommendations" (`milestones.ts:117`), "Built it end to end", "several customer-panel screens", "several models" (it is four), "real" ×4 in the timeline; Sahayogi end state (22 Dec 2026) not derived from one value (`experience.ts:3, 52`, `milestones.ts:172`, `Hero.tsx:8`, `profile.ts:18`, `opengraph-image.tsx:5, 35`, `app/layout.tsx:58`), `© 2026` hard-coded (`SiteFooter.tsx:20`), unrendered `roadmap.ts` arrays; "Full Stack Developer Intern" vs "Full Stack Intern", "RBH Solutions Private Limited" vs "RBH Solutions", three spellings of the degree; "Client Work" vs sentence case (`sections.ts:8`, `ClientWork.tsx:31`, `roadmap.ts:13`); contractions only in client work, curly vs straight apostrophes; "Stored in my own Postgres. No third-party form service." omits the Resend relay, IP hash and user agent (`ContactForm.tsx:103`). Fix: one rule each as listed by the copy reviewer. S.

Remaining `[CONFIRM]`/`[DRAFT]`: no `[DRAFT]`/`TODO`/`FIXME` remains. `client-work.ts:102` `[CONFIRM] see report` (both hindsight lines render as fact), `client-work.ts:16` and `README.md:51` only mention the marker. Mehul-facing open questions are in `~/Library/Application Support/Claude/side-session-notes/…/B-client-work.md` (11 items) and `D-writeup-refine.md` (10 items), plus: usage figure for Client Work, "from 2027", the reply-time promise, the school move years.

---

## 5. What is already excellent (do not break)

- **Client Work decision cards** (problem, choice, result, "Implemented in <file>"), the explicit sole-ownership sentence, the "What I'd do differently" block, the server-trace panel per step, the walkthrough honesty note ("sample data"). "Rate limits for a classroom on one Wi-Fi" is the best paragraph on the site.
- **Prose discipline:** no em-dash or en-dash as punctuation in any rendered string, no marketing adjectives, content-file headers that name their sources and what is left out, skill notes that say no ("Nothing deployed on it yet"), Research's restraint, almost every resume/codebase fact exact (CGPA 7.79, certificates, 6 roles, 31 tables, 13 migrations, argon2id parameters, 300/600 limits).
- **Motion/no-JS foundations:** content hidden only under `html.js-motion` set before first paint; reduced motion shows the finished state; 41/41 reveals visible without JS and with `js-motion` stripped; the reveal-on-anchor bug is fixed on every navigation path at both widths on prod and local; walkthrough state sync (19/19 transitions); only the active video loads; zero console errors; CLS ≈0; per-frame work bypasses React; idle rAF 0.
- **Accessibility craft:** correct walkthrough tablist ARIA with roving tabindex and wrapping arrows, clean heading outline (one h1, no skipped levels), visible skip link, deep links landing exactly 16 px below the sticky header, contact form focus management and live regions (exactly one POST on double submit, strict response parser, 15 s timeout), a single axe violation on prod.
- **Backend:** tagged-template SQL everywhere with shape checks on ids and cursors, constant-time comparison hashing both sides first, authorization never resting on the proxy (every page re-checks), correct Origin-based CSRF model for same-site hosts (`"null"` rejected), non-leaky errors via `errorClass()`, CSV export with formula neutralisation and keyset streaming, allow-listed relative redirects, per-day random salt for pulse with DNT/GPC honoured, noindex in three layers, a 32-character secret minimum, admin works without JavaScript, a clean 500 inside the client's abort window.
- **Hygiene:** `tsc` clean, `npm test` 45/45, no `any`/`@ts-ignore`/non-null assertions, why-comments throughout, a shared wire-contract type for contact, 918 + 286 lines of the old Airmail/Dialog removed with no leftovers in TS.
- **Visual system:** one accent colour, mono labels, hairline grids, two hero buttons (down from four), a current footer date, no horizontal scroll at 375.

---

## 6. Proposed fix plan for round 2

Four work packages with disjoint file ownership, ordered by impact. `app/globals.css` and `client-work.css` belong to WP2 only; WP4 hands CSS needs to WP2 in its brief.

### WP1 Content, copy and facts (impact: highest, mostly S)
**Owns:** `lib/content/*.ts`, `README.md`, `components/sections/Contact.tsx`, `ContactForm.tsx`, `ContactEmailNote.tsx`, `use-contact-form.ts`, `components/sections/RevisionHistory.tsx`, `app/not-found.tsx`, `app/opengraph-image.tsx`, `app/layout.tsx` metadata strings only, `public/Mehul_Gupta_Resume.pdf` (web copy without phone).
**Findings:** B1 (copy half; ops half is Mehul's Vercel env), B2, B3, M2 (with Mehul's fact), M8, M16, M17, m4, m39 (client side), m40, plus the README line of M15. M9's caption strings are provided in this report for WP4.
**Needs from Mehul:** the `[CONFIRM]` answers (usage number, school years, "startup", "since September", reply time, "from 2027").
**Effort:** ~1 day (S×9, M×1).

### WP2 Interaction, motion, accessibility and global CSS (impact: high)
**Owns:** `components/sections/Walkthrough.tsx` (+ new `walkthrough/*`), `components/sections/RevisionTrack.tsx`, `IdCard.tsx`, `lib/motion/**`, `components/navigation/**`, `components/ui/CopyButton.tsx`, `components/animation/**`, `app/globals.css`, `app/styles/*.css`, `app/layout.tsx` head script and font preload, `lib/smooth-scroll.ts`, `eslint.config.mjs`.
**Findings:** B4, M3 (video/trace behaviour), M4, M5, M6, M7, M13, M14 (poster/cache/saveData in component), M18 note (Walkthrough split), m2, m3, m5-m9, m11-m16, m18 (dynamic imports), m19, m36 (CSS utilities), m37 (globals split), the lint ignore of M15.
**Effort:** ~2 days (M×6, L×1 for the Walkthrough split + phone crops).

### WP3 Backend hardening, shared helpers, tests, docs (impact: high for the free tier)
**Owns:** `app/api/**`, `lib/contact/**` (non-UI), `lib/admin/**`, `lib/pulse/**`, `lib/db/**`, `proxy.ts`, `next.config.ts`, `vercel.json`, `app/admin/**`, `scripts/**`, `docs/contact-backend.md`, `docs/admin-panel.md`, `.env.example`, `package.json` scripts, `lib/**/*.test.mjs`, new `lib/http/**`.
**Findings:** M11, M12, M15 (docs and `.env.example` half), M18, m20, m21 (proxy/redirect half), m23-m35, m12 (admin focus), m37 (backend dead exports).
**Effort:** ~2 days (S×10, M×4).

### WP4 Page composition and section UI (impact: high on the founder score)
**Owns:** `components/sections/Hero.tsx`, `ClientWork.tsx`, `Research.tsx`, `PinBoard.tsx`, `Appendix.tsx`, `SystemMap.tsx`, `SystemMapExplorer.tsx`, `Experience.tsx`, `components/ui/Stamp.tsx`, `SheetSketch.tsx`.
**Findings:** M1, M9 (UI + captions), M10, m1, m13, m17 (noscript trimmed in cooperation with WP2: WP4 supplies a text-only fallback list, WP2 wires it), the `now` prop of B4, the second live-site button and section titles per the copy reviewer's table (Experience "What I built at work", Research "One manuscript, under review", Contact "Email me, or write here", Skills "Where I used each skill").
**Effort:** ~1.5 days (M×3, S×6).

**Suggested order:** WP1 and WP3 first (both independent, highest score lift per hour: B1-B3 and the free-tier bounds), WP2 in parallel, WP4 last so it can use the final copy. Expected after round 2: founder 8, a11y/perf 8, security 8, quality 8, copy 8 → overall ≈ 8.

---

## 7. Lighthouse and bundle numbers

Lighthouse 12.2.1, Chrome 157, https://mehulgupta.me, headless, three runs each (raw reports in the scratchpad `lh/`).

| Run | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS | Speed Index |
|---|---|---|---|---|---|---|---|---|---|
| Desktop (`--preset=desktop`) ×3 | 100 / 100 / 100 | 100 | 100 | 100 | 0.3 s | 0.5-0.6 s | 0 ms | 0 | 0.4 s |
| Mobile (default) ×3 | 94 / 94 / 95 | 100 | 100 | 100 | 1.1 s | 3.0 s | 0-20 ms | 0.003-0.004 | 1.3-1.5 s |

Total transfer 415 KiB in all runs. Top opportunities (mobile): `largest-contentful-paint` 3.0 s scored 0.77 (the Lighthouse trace-element audit errored on this Chrome, so the LCP node is not reported; the hero image `mehul-cutout.png` is preloaded at `w=384`, 9.6 KB); `unused-javascript` ~51 KiB (chunks `1499jx…` 37 % unused, `20lbtj…` 56 % unused; 300 ms mobile); `modern-image-formats` ~50 KiB, solely `walk-faculty.jpg` (85 KB, 51 KiB wasted; M14); `dom-size` 1,247-1,308 elements (score 0.5).

Bundle (`npm run build`, Next 16.4.6 Turbopack; route `/` static, all admin and API routes dynamic, `ƒ Proxy`):

| Item | Raw | Gzip |
|---|---|---|
| All JS referenced by `/` (11 chunks) | 688 KB | 215 KB |
| of which `noModule` polyfill chunk `0cz1d0mv5g_q7.js` (not fetched by modern browsers) | 113 KB | 39.4 KB |
| First-load JS actually fetched on production (10 scripts) | | ≈179 KB |
| Largest chunks (React DOM/Next, router, app client components) | 229 / 160 / 105 KB | 71.5 / 43.9 / 35.2 KB |
| CSS | 80.9 KB | 15.7 KB |
| HTML (`.next/server/app/index.html`) | 268 KB | 41.7 KB |

Network on a cold production load at 1440 (before any scroll): 21 requests, 428 KB (375: 423 KB): HTML 36.7 KB, 5 fonts 88 KB, hero image 22.7 KB, CSS 16.4 KB, scripts 179 KB, `walk-faculty.jpg` 83.4 KB, icon 1.5 KB, pulse beacon 204 B. During a slow scroll: mp4 metadata at y≈1350, the full 2.35 MB mp4 at y≈2250, ID-card images between y≈4950 and 8550 (about 2.39 MB loaded during the scroll).

Other measurements: `npm test` 45 pass / 0 fail; `npx tsc --noEmit` exit 0; source-only ESLint exit 0; CLS 0.0000 on load and while scrolling at 1440, 0.0027 on load at 375; no console errors or warnings on production or dev; page 10,673 px tall at 1440 (11.9 screens), 20,947 px at 375 (25.8 screens); ~2,480 visible words (~11 min), 263 s of walkthrough video.

Not verified empirically (reasoned from documentation or code): Vercel's `x-forwarded-for` overwrite, Next's production `Cache-Control` on dynamic pages, `request.url` on Vercel, Neon/Resend/Vercel Hobby free-tier numbers used in M11, iOS Safari behaviour (Chromium only), `visibilitychange` handling in the walkthrough, Vercel's subdomain-claim rules, and the Sahayogi One task document.
