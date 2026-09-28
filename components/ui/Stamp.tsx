import type { CSSProperties, ReactNode } from "react";

/*
  A rubber stamp: a double-ruled box of mono capitals, inked through the #ink-stamp
  filter (see Ink.tsx) and set slightly off square, since nobody stamps perfectly
  straight. Inside a Reveal it stamps down when the Reveal fires; give it `now` to stamp
  the moment it mounts instead. Styles live under "Ink" in globals.css.
*/
export function Stamp({
  children,
  tone = "redline",
  rotate = -2.5,
  now = false,
  className = "",
}: {
  children: ReactNode;
  tone?: "redline" | "accent";
  /** Degrees off square. */
  rotate?: number;
  /** Stamp on mount rather than waiting for the enclosing Reveal. */
  now?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`stamp ${tone === "accent" ? "text-accent" : "text-redline"} ${now ? "stamp-now" : ""} ${className}`}
      style={{ "--stamp-rot": `${rotate}deg` } as CSSProperties}
    >
      {children}
    </span>
  );
}
