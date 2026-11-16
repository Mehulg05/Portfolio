/*
  The LinkButton recipe from components/ui, restated for <button> and for the full-width
  stacked layout the admin pages use on phones (LinkButton is an inline anchor only).
*/
const recipe =
  "transition-colors active:translate-y-px disabled:cursor-wait disabled:opacity-60 inline-flex min-h-11 items-center justify-center gap-2 border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] sm:min-h-10";
const base = `${recipe} w-full sm:w-auto`;

const tones = {
  default: "border-line-bright text-ink-dim hover:border-accent hover:text-accent",
  accent: "border-accent bg-accent text-ground hover:border-ink hover:bg-ink",
} as const;

export const buttonStyles = {
  default: `${base} ${tones.default}`,
  accent: `${base} ${tones.accent}`,
  /** Full width at every size, for a form that is its own column (the sign-in sheet). */
  accentBlock: `${recipe} w-full ${tones.accent}`,
} as const;

export const labelStyle = "font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint";
