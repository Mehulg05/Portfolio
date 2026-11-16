import type { CSSProperties } from "react";
import { Reveal } from "@/components/animation/Reveal";

type Props = {
  label: string;
  title: string;
  caption?: string;
};

// The rule, the corner ticks and the typing are all in globals.css under `.plot-header`.
export function SectionHeader({ label, title, caption }: Props) {
  // A label that only repeats the title reads as a stutter, so the title stands alone.
  const showLabel = label.trim().toLowerCase() !== title.trim().toLowerCase();

  return (
    <Reveal as="header" className="plot-header tick-frame">
      {showLabel ? (
        <div className="flex items-baseline gap-4 label-mono">
          <span
            className="plot-label text-ink-faint"
            // One typing step per character.
            style={{ "--n": label.length } as CSSProperties}
          >
            {label}
          </span>
        </div>
      ) : null}
      <h2
        className={`plot-title font-display text-3xl tracking-tight text-ink sm:text-4xl ${
          showLabel ? "mt-4" : ""
        }`}
      >
        {title}
      </h2>
      {caption ? <p className="plot-caption measure mt-3 text-ink-dim">{caption}</p> : null}
    </Reveal>
  );
}
