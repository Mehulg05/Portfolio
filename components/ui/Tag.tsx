import type { Depth } from "@/lib/content/skills";
import { depthLabels } from "@/lib/content/skills";
import { skillKey } from "@/lib/skill-link";

/*
  A tag carries its skill key, so hovering it lights the same skill in the skills map
  and a click on a chip there lights the tag back. Only string children can be keyed;
  anything else renders as a plain tag.
*/
export function Tag({ children }: { children: React.ReactNode }) {
  const key = typeof children === "string" ? skillKey(children) : undefined;
  return (
    <span
      data-skill={key}
      className="skill-tag border border-line bg-surface px-2 py-1 font-mono text-[11px] tracking-[0.04em] text-ink-dim"
    >
      {children}
    </span>
  );
}

const depthStyles: Record<Depth, string> = {
  shipped: "border-accent/45 text-accent",
  academic: "border-line-bright text-ink-dim",
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
