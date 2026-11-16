# Open questions for Mehul (round 2, WP1)

Nothing below is stated as fact on the site. Each line is either reworded to what the resume supports or left out until you answer. Search `lib/content/` for `[CONFIRM]` to find the spots.

1. **Usage evidence for Alpha Academy (M2).** One real figure: active accounts, months in production, or records written. It replaces the weakest stats tile (`client-work.ts`, `facts`). Until then the tiles stay code counts and the status stays "Live in production".
2. **School years (M16).** Education has Class X at Dyal Singh (2021) and Class XII at Greenland Public School (2023); the timeline used to say "2008 – 2023" at Dyal Singh. The card now says "Until 2023". Give the Dyal Singh years and when you moved to Greenland, so one clause can cover the move.
3. **"Startup" (M16).** Removed. Is Sahayogi One a startup, and may the page say so? Also, "business software for Indian SMEs" was dropped; confirm if you want it back.
4. **"Since September" for the WhatsApp work (M16).** Removed from the timeline and from the skills note. Give the start month if you want it shown.
5. **Reply time (M16).** "Usually within two days" is gone from the contact intro and the confirmation message. Confirm a real figure to restore it.
6. **"Looking for roles after I graduate in 2027" (M16).** The contact intro now says this, built from the confirmed graduation year and the existing `openTo` line. Confirm you want the intent stated this way.
7. **"First developer job" (M16).** The timeline no longer says it. Confirm how the Sahayogi placement should be described.
8. **Hindsight block (Client Work).** Both "What I'd do differently" lines are your opinions and still carry `[CONFIRM]`. Confirm or edit them.
9. **Scale facts per role (m4).** One number for each of Sahayogi One and RBH (users, modules, screens), if shareable. RBH stack tags are still missing; tell me the stack.
10. **Test counts (B2).** The page now says "43 Vitest files". If you want "integration" beside a number, count the files by hand first.
11. **Resume PDF.** The site copy has no phone number. The original with the phone is still in git history of this repo; if you want that gone too, it needs a history rewrite, which I did not do.
12. **Vercel env (B1, ops half).** Set `DATABASE_URL`, `IP_HASH_SALT` and the rest from `docs/contact-backend.md` and redeploy. Until then the site shows the email-only contact panel.

## Left for other work packages

- Second "Live site" button in `components/sections/ClientWork.tsx` (M17): WP4 owns it.
- m39 server half (`app/api/contact/route.ts` strings, admin copy): WP3.
- m40 remaining: one derived Sahayogi end date, `© 2026` in the footer, unrendered `roadmap.ts` arrays, Postgres/PostgreSQL and similar spelling rules. Not done in this pass.
- M15 `contact-backend.md`, `.env.example`, `eslint.config.mjs`: WP2/WP3.
