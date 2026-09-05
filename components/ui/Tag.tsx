import type { Depth } from "@/lib/content/skills";
import { depthLabels } from "@/lib/content/skills";

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="border border-line bg-surface px-2 py-1 font-mono text-[11px] tracking-[0.04em] text-ink-dim">
      {children}
    </span>
  );
}

const depthStyles: Record<Depth, string> = {
  shipped: "border-accent/45 text-accent",
  research: "border-redline/45 text-redline",
  learning: "border-line-bright text-ink-faint",
};

export function DepthBadge({ depth }: { depth: Depth }) {
  return (
    <span
      className={`border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${depthStyles[depth]}`}
    >
      {depthLabels[depth]}
    </span>
  );
}
