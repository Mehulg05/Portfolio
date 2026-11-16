import { formatCount, formatDay, plural } from "@/app/admin/_charts/format";

export type BarDatum = {
  /** UTC "YYYY-MM-DD", oldest first; the last entry is today. */
  day: string;
  value: number;
  /** Optional second measure drawn inside the bar; must not exceed `value` to read correctly. */
  secondary?: number;
};

type Unit = { one: string; many?: string };

type Props = {
  data: BarDatum[];
  /** What a bar counts, for tooltips and the summary: { one: "view" }. */
  unit: Unit;
  /** Present when the data carries a `secondary` measure; adds the inner bar and a legend. */
  secondaryUnit?: Unit;
  /** Short name of the chart, the start of the accessible summary. */
  title: string;
};

/*
  The SVG stretches horizontally only (preserveAspectRatio="none") and its viewBox height
  equals the CSS height, so a viewBox unit is one CSS pixel vertically at any width: the
  1px baseline and the 1px zero stubs stay 1px from 375 px to 1440 px. Text lives in HTML
  around the SVG for the same reason; SVG text would scale with the chart.
*/
const SLOT = 10;
const BAR = 6;
const HEIGHT = 112;
const TOP_PAD = 10;
const MIN_BAR = 2;
const PLOT = HEIGHT - 1 - TOP_PAD;

function barHeight(value: number, max: number) {
  if (value <= 0) return 0;
  return Math.max(MIN_BAR, (value / max) * PLOT);
}

function unitLabel(count: number, unit: Unit) {
  return plural(count, unit.one, unit.many);
}

function tooltip(datum: BarDatum, unit: Unit, secondaryUnit?: Unit) {
  const parts = [formatDay(datum.day), unitLabel(datum.value, unit)];
  if (secondaryUnit && datum.secondary !== undefined) parts.push(unitLabel(datum.secondary, secondaryUnit));
  return parts.join(" · ");
}

function summarise({ data, unit, secondaryUnit, title }: Props) {
  if (data.length === 0) return `${title}: no data.`;
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const peak = data.reduce((best, d) => (d.value > best.value ? d : best), data[0]);
  const today = data[data.length - 1];
  const parts = [
    `${title}, ${data.length} days from ${formatDay(data[0].day)} to ${formatDay(today.day)}`,
    `${unitLabel(total, unit)} in total`,
  ];
  if (secondaryUnit) {
    const secondary = data.reduce((sum, d) => sum + (d.secondary ?? 0), 0);
    parts.push(`${unitLabel(secondary, secondaryUnit)}`);
  }
  if (total > 0) parts.push(`peak ${formatCount(peak.value)} on ${formatDay(peak.day)}`);
  parts.push(`today ${formatCount(today.value)}`);
  return `${parts.join(", ")}.`;
}

function Bar({ datum, index, max, isToday, hasSecondary, label }: {
  datum: BarDatum;
  index: number;
  max: number;
  isToday: boolean;
  hasSecondary: boolean;
  label: string;
}) {
  const x = index * SLOT + (SLOT - BAR) / 2;
  const base = HEIGHT - 1;
  const outer = barHeight(datum.value, max);
  const inner = hasSecondary ? barHeight(Math.min(datum.secondary ?? 0, datum.value), max) : 0;
  const tone = isToday ? "text-accent" : "text-ink-dim";

  return (
    <g className={tone}>
      <title>{label}</title>
      {/* Full-height hit area, so a zero day still has a tooltip under the pointer. */}
      <rect x={index * SLOT} y={0} width={SLOT} height={HEIGHT} fill="transparent" />
      {outer === 0 ? (
        <rect x={x} y={base - 1} width={BAR} height={1} className="text-ink-faint" fill="currentColor" opacity={0.45} />
      ) : hasSecondary ? (
        <>
          <rect x={x} y={base - outer} width={BAR} height={outer} fill="currentColor" fillOpacity={0.3} />
          {inner > 0 ? <rect x={x} y={base - inner} width={BAR} height={inner} fill="currentColor" /> : null}
        </>
      ) : (
        <rect x={x} y={base - outer} width={BAR} height={outer} fill="currentColor" />
      )}
    </g>
  );
}

function Legend({ unit, secondaryUnit }: { unit: Unit; secondaryUnit: Unit }) {
  return (
    <span aria-hidden="true" className="flex items-center gap-3">
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-2 bg-ink-dim/30" />
        {unit.many ?? `${unit.one}s`}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-2 bg-ink-dim" />
        {secondaryUnit.many ?? `${secondaryUnit.one}s`}
      </span>
    </span>
  );
}

function TickLabels({ data }: { data: BarDatum[] }) {
  const n = data.length;
  if (n === 0) return null;
  const middle = Math.floor((n - 1) / 2);
  return (
    <div aria-hidden="true" className="relative mt-1.5 h-3.5 font-mono text-[10px] leading-none text-ink-faint tabular-nums">
      <span className="absolute left-0">{formatDay(data[0].day)}</span>
      {n > 2 ? (
        <span className="absolute -translate-x-1/2" style={{ left: `${((middle + 0.5) / n) * 100}%` }}>
          {formatDay(data[middle].day)}
        </span>
      ) : null}
      <span className="absolute right-0 text-accent">{formatDay(data[n - 1].day)}</span>
    </div>
  );
}

/** Daily bars: one slot per day, today in accent, a hairline baseline and a dashed line at the peak. */
export function BarStrip(props: Props) {
  const { data, unit, secondaryUnit } = props;
  const max = data.reduce((m, d) => Math.max(m, d.value), 0);
  const scale = Math.max(1, max);
  const width = Math.max(1, data.length) * SLOT;
  const hasSecondary = secondaryUnit !== undefined;

  return (
    <figure className="min-w-0">
      <figcaption className="mb-1.5 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint tabular-nums">
        <span>{max > 0 ? `max ${formatCount(max)} / day` : "no data in range"}</span>
        {secondaryUnit ? <Legend unit={unit} secondaryUnit={secondaryUnit} /> : null}
      </figcaption>
      <svg
        role="img"
        aria-label={summarise(props)}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="block h-28 w-full"
      >
        {max > 0 ? (
          <line
            x1={0}
            x2={width}
            y1={TOP_PAD + 0.5}
            y2={TOP_PAD + 0.5}
            className="text-line-bright"
            stroke="currentColor"
            strokeDasharray="2 3"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        <line
          x1={0}
          x2={width}
          y1={HEIGHT - 0.5}
          y2={HEIGHT - 0.5}
          className="text-line-bright"
          stroke="currentColor"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((datum, index) => (
          <Bar
            key={datum.day}
            datum={datum}
            index={index}
            max={scale}
            isToday={index === data.length - 1}
            hasSecondary={hasSecondary}
            label={tooltip(datum, unit, secondaryUnit)}
          />
        ))}
      </svg>
      <TickLabels data={data} />
    </figure>
  );
}
