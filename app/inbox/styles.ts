/*
  The LinkButton recipe from components/ui, restated for <button> and for the full-width
  stacked layout the inbox uses on phones (LinkButton is an inline anchor only).
*/
const base =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 border px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] sm:min-h-10 sm:w-auto";

export const buttonStyles = {
  default: `${base} border-line-bright text-ink-dim hover:border-accent hover:text-accent`,
  accent: `${base} border-accent bg-accent text-ground hover:border-ink hover:bg-ink`,
} as const;

export const labelStyle = "font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint";
