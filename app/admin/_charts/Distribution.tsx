import { formatCount, formatPercent } from "@/app/admin/_charts/format";

export type Bucket = { label: string; count: number };

type Props = {
  /** In their natural order (e.g. 0-25% first). */
  buckets: Bucket[];
  title: string;
  unit: string;
};

const HEIGHT = 72;

function summarise({ buckets, title, unit }: Props, total: number) {
  if (total === 0) return `${title}: no data.`;
  const parts = buckets.map((b) => `${b.label} ${formatPercent(b.count, total)} (${formatCount(b.count)})`);
  return `${title}, ${formatCount(total)} ${unit}: ${parts.join(", ")}.`;
}

/*
  Side-by-side columns rather than a stacked bar: the buckets are ordered, and comparing
  heights on a shared baseline is easier than comparing segment widths.
*/
export function Distribution(props: Props) {
  const { buckets } = props;
  const total = buckets.reduce((sum, b) => sum + b.count, 0);
  const max = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <figure role="img" aria-label={summarise(props, total)} className="min-w-0">
      <div
        aria-hidden="true"
        className="grid gap-2 sm:gap-3"
        style={{ gridTemplateColumns: `repeat(${Math.max(1, buckets.length)}, minmax(0, 1fr))` }}
      >
        {buckets.map((bucket) => {
          const h = bucket.count > 0 ? Math.max(2, (bucket.count / max) * (HEIGHT - 1)) : 0;
          return (
            <div key={bucket.label} className="min-w-0">
              <p className="mb-1 font-mono text-[11px] text-ink tabular-nums">{formatPercent(bucket.count, total)}</p>
              <svg viewBox={`0 0 10 ${HEIGHT}`} preserveAspectRatio="none" className="block h-[72px] w-full">
                <line
                  x1={0}
                  x2={10}
                  y1={HEIGHT - 0.5}
                  y2={HEIGHT - 0.5}
                  className="text-line-bright"
                  stroke="currentColor"
                  vectorEffect="non-scaling-stroke"
                />
                {h > 0 ? (
                  <rect x={0} y={HEIGHT - 1 - h} width={10} height={h} className="text-ink-dim" fill="currentColor" />
                ) : (
                  <rect x={0} y={HEIGHT - 2} width={10} height={1} className="text-ink-faint" fill="currentColor" opacity={0.45} />
                )}
              </svg>
              <p className="mt-1.5 font-mono text-[10px] text-ink-faint tabular-nums">{bucket.label}</p>
              <p className="font-mono text-[10px] text-ink-faint tabular-nums">{formatCount(bucket.count)}</p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
