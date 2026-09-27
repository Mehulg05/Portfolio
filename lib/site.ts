/*
  The public origin. Set NEXT_PUBLIC_SITE_URL in Vercel (https://mehulgupta.me); the
  localhost fallback exists only so `next dev` works without it.
*/
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Colours shared by the generated icon and share image. Mirrors the @theme tokens. */
export const brand = {
  ground: "#0b0e13",
  surface: "#11151c",
  line: "#232a35",
  ink: "#e6eaf2",
  inkDim: "#939dac",
  accent: "#5c8dff",
} as const;
