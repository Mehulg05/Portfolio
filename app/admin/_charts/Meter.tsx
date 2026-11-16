import type { ReactNode } from "react";
import { formatCount } from "@/app/admin/_charts/format";

/*
  One labelled horizontal bar: the row primitive behind HBarList and Funnel. The row is
  plain HTML text (label, count, share), so a screen reader reads the numbers directly and
  the bar itself is decorative.
*/

const BAR_HEIGHT = 6;

type MeterProps = {
  label: ReactNode;
  count: number;
  /** 0..1, the bar's length relative to the row it is compared with. */
  fraction: number;
  /** Right-most column, usually a percentage. */
  note?: string;
  /** Hover text for the whole row. */
  hint?: string;
  tone?: "dim" | "accent";
};

function Bar({ fraction, tone }: { fraction: number; tone: "dim" | "accent" }) {
  const clamped = Math.min(1, Math.max(0, fraction));
  // A non-zero count never collapses to nothing next to a large one.
  const width = clamped > 0 ? Math.max(0.75, clamped * 100) : 0;
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 100 ${BAR_HEIGHT}`}
      preserveAspectRatio="none"
      className="block h-1.5 w-full"
    >
      <line
        x1={0}
        x2={100}
        y1={BAR_HEIGHT / 2}
        y2={BAR_HEIGHT / 2}
        className="text-line-bright"
        stroke="currentColor"
        vectorEffect="non-scaling-stroke"
      />
      {width > 0 ? (
        <rect
          x={0}
          y={0}
          width={width}
          height={BAR_HEIGHT}
          className={tone === "accent" ? "text-accent" : "text-ink-dim"}
          fill="currentColor"
        />
      ) : null}
    </svg>
  );
}

export function MeterRow({ label, count, fraction, note, hint, tone = "dim" }: MeterProps) {
  return (
    <li
      title={hint}
      className="grid grid-cols-[minmax(0,6.5rem)_minmax(2.5rem,1fr)_auto_2.75rem] items-center gap-x-3 py-1.5 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto_3rem]"
    >
      <span className="truncate text-[13px] text-ink">{label}</span>
      <Bar fraction={fraction} tone={tone} />
      <span className="text-right font-mono text-[11px] text-ink tabular-nums">{formatCount(count)}</span>
      <span className="text-right font-mono text-[10px] text-ink-faint tabular-nums">{note ?? ""}</span>
    </li>
  );
}

export function EmptyRows({ children }: { children: ReactNode }) {
  return <p className="py-1.5 font-mono text-[11px] text-ink-faint">{children}</p>;
}
