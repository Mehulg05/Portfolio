Mehul Gupta

Personal portfolio at mehulgupta.me. Next.js 16 (App Router), TypeScript, Tailwind v4.

```bash
npm run dev
npm run lint
npm run build
npm test          # node:test suites under lib/**
npm run db:dev    # local Postgres (PGlite); db:migrate, db:inspect, db:prune
```

## Where things live

- `lib/content/*.ts` holds all site copy and data. Edit copy there, never in components.
  Each file opens with a comment naming its sources. A line that cannot be traced to
  one of them does not ship.
- `lib/content/experience.ts` describes work at an employer. It names no products. Check
  with Sahayogi One before adding detail about their software.
- `lib/content/sections.ts` is the list of page sections in page order. The header nav
  reads it.
- `lib/content/client-work.ts` is the Alpha Academy case study. It is rendered by
  `components/sections/ClientWork.tsx` and `Walkthrough.tsx`, with the screen recordings
  and posters in `public/client-work/`.
- `components/sections/` has one component per page section. `components/ui/` and
  `components/navigation/` hold the shared pieces.
- `components/ui/LinkButton.tsx` renders every external link. Never show a raw URL as
  visible text.
- `lib/motion/` holds the scroll and motion hooks.
- `app/globals.css` holds the design tokens (`@theme`) and the grid utilities.
- `app/opengraph-image.tsx` and `app/twitter-image.tsx` draw the link-preview images at
  build time.
- `docs/` holds setup notes. `docs/contact-backend.md` covers the contact form's backend:
  the database, email notifications and the environment variables it needs.

## Motion and fallbacks

The page is complete as static HTML. All motion sits behind a `js-motion` class that a
script in `<head>` sets only when JavaScript runs and `prefers-reduced-motion` is off.
Without it, every section renders fully visible and still. The larger pieces, such as
the pinned timeline track, also check `lib/motion/use-motion-enabled.ts`, which needs a
1024px viewport. Scroll-linked work shares one rAF-throttled listener in
`lib/motion/scroll-progress.ts`. Scrolling is native; anchors use `scroll-margin-top`. There is no animation library.

## Deploying (Vercel, free tier)

Push to GitHub, import the repo on Vercel and accept the defaults. Set
`NEXT_PUBLIC_SITE_URL` to the live domain so metadata and JSON-LD resolve to real URLs.
The contact form's own variables are listed in `docs/contact-backend.md`.

## Before deploying

- Search `lib/content/` for `[CONFIRM]` and settle each marked line before it goes live.
- Update `now.asOf` in `lib/content/roadmap.ts`. The footer prints it as "Last updated".
