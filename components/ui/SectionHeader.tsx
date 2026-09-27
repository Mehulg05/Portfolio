import type { CSSProperties } from "react";
import { Reveal } from "@/components/animation/Reveal";

type Props = {
  index: string;
  label: string;
  title: string;
  caption?: string;
};

// The rule, the corner ticks and the typing are all in globals.css under `.plot-header`.
export function SectionHeader({ index, label, title, caption }: Props) {
  return (
    <Reveal as="header" className="plot-header tick-frame">
      <div className="flex items-baseline gap-4 font-mono text-[11px] uppercase tracking-[0.16em]">
        <span
          className="plot-label text-ink-faint"
          // One typing step per character.
          style={{ "--n": label.length } as CSSProperties}
        >
          {label}
        </span>
      </div>
      <h2 className="plot-title mt-4 font-display text-3xl tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {caption ? (
        <p className="plot-caption mt-3 max-w-[62ch] text-ink-dim">{caption}</p>
      ) : null}
    </Reveal>
  );
}
