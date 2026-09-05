# Build Log — Mehul Gupta

Personal portfolio. Next.js 16 (App Router) · TypeScript · Tailwind v4.

```bash
npm run dev
```

## Where things live

- `lib/content/*.ts` — all site copy and data. Edit here, not in components.
- `lib/content/experience.ts` — **describes an employer's products. Needs Sahayogi One's
  sign-off before this section goes live.** Keep it to one line per product.
- `components/ui/LinkButton.tsx` — every external destination goes through this. Never
  render a raw URL as visible text.
- `components/sections/` — one component per page section, in page order.
- `components/ui/`, `components/navigation/` — the reusable pieces.
- `app/globals.css` — design tokens (`@theme`) and the schematic grid/tick utilities.

## Build phases

Phase 1 (done): static build, real content, zero animation — still the
`prefers-reduced-motion` and no-JS fallback.

Phase 2 (done): motion layer — Lenis smooth scroll, scroll progress + section readout
in the header, active-section nav, reveal-on-scroll, hero load sequence. All of it is
gated behind a `js-motion` class set by a script in `<head>`; without JS or with reduced
motion the page renders fully visible and static.

Phase 3 (done): the three signature moments — a pinned Revision History track, a
self-drawing architecture schematic in How I Build, and a held Vision statement with
rising backdrop density — plus depth filtering on the System Map. These run only at
≥1024px with motion allowed (`lib/motion/use-motion-enabled.ts`); everywhere else the
Phase 1 static presentation is what renders.

No GSAP. All three scrubs share one rAF-throttled scroll listener
(`lib/motion/scroll-progress.ts`) and CSS sticky positioning, which does the same job
as ScrollTrigger pinning here for none of the bundle weight.

Phase 4 (done): case files are expandable, each with its own architecture flow diagram.
Built on native `<details>`, so the disclosure works with zero JavaScript and keeps
correct assistive-technology semantics; the height animation is progressive enhancement
via `::details-content` and degrades to an instant toggle.

Phase 5 (done): polish, performance and accessibility pass.

- `--color-ink-faint` was lightened from `#626c7a` to `#7a8595` — the old value failed
  WCAG AA at 3.2:1 against `surface-2`, and it sets every small mono label on the site.
- Lenis is dynamically imported, keeping it out of the first paint.
- Initial JS is ~181 KB gzipped, CSS ~7 KB. That JS is close to the Next.js App Router
  floor; the page itself renders from static HTML and does not wait on it.
- Portrait at `public/mehul-portrait.png` (1086×1448 lossless source) is served through
  `next/image` at quality 90 — roughly 12 KB of AVIF at a 320 px display width.

Remaining: real project screenshots. Drop a PNG in `/public` and set `screenshot` on the
case file in `lib/content/projects.ts` — the render slot is already wired.

## Deploying (Vercel, free tier)

The site is fully static (`○ Static` for every route) and has **no backend**, so nothing
needs Render. Push to GitHub, import the repo on Vercel, and accept the defaults —
Next.js needs no configuration there. Set `NEXT_PUBLIC_SITE_URL` to the live domain in
the Vercel project's environment variables so metadata and JSON-LD resolve to real URLs.

If you ever add a contact form, prefer a Vercel Route Handler over a Render service:
Render's free tier sleeps after inactivity, so a recruiter's first submit would hang
for ~50s.

## Before deploying

- Replace lines marked `[DRAFT]` in `lib/content/` with your own wording.
- Fill `outcome` in `lib/content/projects.ts` where you have a real number.
- Set `NEXT_PUBLIC_SITE_URL` to the deployed domain so metadata and JSON-LD resolve.
- Add an OG image at `app/opengraph-image.png`.
