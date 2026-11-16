import type { ReactNode } from "react";
import { formatPercent } from "@/app/admin/_charts/format";
import { EmptyRows, MeterRow } from "@/app/admin/_charts/Meter";

export type HBarItem = {
  /** Stable key and the text a reader hears. */
  key: string;
  /** Visible label; defaults to `key`. */
  label?: ReactNode;
  count: number;
};

type Props = {
  items: HBarItem[];
  /** Accessible name of the list. */
  title: string;
  /** Denominator for the share column (e.g. total views); omitted, the column stays empty. */
  total?: number;
  empty?: string;
};

/** Ranked label · bar · count rows; bars are proportional to the largest row. */
export function HBarList({ items, title, total, empty = "No data yet." }: Props) {
  if (items.length === 0) return <EmptyRows>{empty}</EmptyRows>;
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <ol aria-label={title} className="min-w-0">
      {items.map((item) => (
        <MeterRow
          key={item.key}
          label={item.label ?? item.key}
          count={item.count}
          fraction={item.count / max}
          note={total === undefined ? undefined : formatPercent(item.count, total)}
        />
      ))}
    </ol>
  );
}
