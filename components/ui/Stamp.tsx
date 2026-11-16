import type { CSSProperties, ReactNode } from "react";

/*
  A rubber stamp: a double-ruled box of mono capitals, inked through the #ink-stamp
  filter (see Ink.tsx) and set slightly off square, since nobody stamps perfectly
  straight. Inside a Reveal it stamps down when the Reveal fires. Styles live under "Ink" in globals.css.
*/
export function Stamp({
  children,
  tone = "redline",
  rotate = -2.5,
  className = "",
}: {
  children: ReactNode;
  tone?: "redline" | "accent";
  /** Degrees off square. */
  rotate?: number;
  className?: string;
}) {
  return (
    <span
      className={`stamp ${tone === "accent" ? "text-accent" : "text-redline"} ${className}`}
      style={{ "--stamp-rot": `${rotate}deg` } as CSSProperties}
    >
      {children}
    </span>
  );
}
