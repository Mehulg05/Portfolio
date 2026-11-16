import { formatCount, formatPercent } from "@/app/admin/_charts/format";

export type SplitPart = { label: string; count: number };

type Props = {
  parts: SplitPart[];
  title: string;
};

const HEIGHT = 8;
// Segments alternate between the two tones; a split has two or three parts in practice.
const tones = ["text-accent", "text-ink-dim", "text-line-bright"] as const;

// Each segment starts where the previous one ended, as a share of 100 viewBox units.
function layout(parts: SplitPart[], total: number) {
  return parts.map((part, index) => {
    const before = parts.slice(0, index).reduce((sum, p) => sum + p.count, 0);
    return {
      ...part,
      x: total > 0 ? (before / total) * 100 : 0,
      width: total > 0 ? (part.count / total) * 100 : 0,
      tone: tones[index % tones.length],
    };
  });
}

/** One bar divided into shares of a whole, for small categorical splits (phone / desktop). */
export function Split({ parts, title }: Props) {
  const total = parts.reduce((sum, p) => sum + p.count, 0);
  const label =
    total === 0
      ? `${title}: no data.`
      : `${title}: ${parts.map((p) => `${p.label} ${formatPercent(p.count, total)}`).join(", ")}.`;

  const segments = layout(parts, total);

  return (
    <figure role="img" aria-label={label} className="min-w-0">
      <svg aria-hidden="true" viewBox={`0 0 100 ${HEIGHT}`} preserveAspectRatio="none" className="block h-2 w-full">
        {total === 0 ? (
          <line
            x1={0}
            x2={100}
            y1={HEIGHT / 2}
            y2={HEIGHT / 2}
            className="text-line-bright"
            stroke="currentColor"
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          segments.map((s) =>
            s.width > 0 ? (
              <rect key={s.label} x={s.x} y={0} width={s.width} height={HEIGHT} className={s.tone} fill="currentColor" />
            ) : null,
          )
        )}
      </svg>
      <ul aria-hidden="true" className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint tabular-nums">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <span className={`inline-block size-2 bg-current ${s.tone}`} />
            <span>{s.label}</span>
            <span className="text-ink">{formatPercent(s.count, total)}</span>
            <span>{formatCount(s.count)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
