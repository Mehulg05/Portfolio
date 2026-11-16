import { formatPercent, plural } from "@/app/admin/_charts/format";
import { EmptyRows, MeterRow } from "@/app/admin/_charts/Meter";

export type FunnelStep = { key: string; label: string; count: number };

type Props = {
  /** In order; every bar and percentage is relative to the first step. */
  steps: FunnelStep[];
  title: string;
  unit: string;
};

/*
  Not a strict funnel: a visitor can jump to a later section from the nav without passing
  the ones above it, so a step can exceed the one before. The rows are still in page order
  because the question is "how far down the page do people get", and the first step is
  every view that reported sections at all.
*/
export function Funnel({ steps, title, unit }: Props) {
  const first = steps[0]?.count ?? 0;
  if (first === 0) return <EmptyRows>No section data yet.</EmptyRows>;

  return (
    <ol aria-label={title} className="min-w-0">
      {steps.map((step, index) => {
        const previous = index > 0 ? steps[index - 1].count : null;
        const hint =
          previous === null
            ? `${step.label}: ${plural(step.count, unit)}`
            : `${step.label}: ${plural(step.count, unit)}, ${formatPercent(step.count, previous)} of the step above`;
        return (
          <MeterRow
            key={step.key}
            label={step.label}
            count={step.count}
            fraction={step.count / first}
            note={formatPercent(step.count, first)}
            hint={hint}
            tone={index === 0 ? "accent" : "dim"}
          />
        );
      })}
    </ol>
  );
}
