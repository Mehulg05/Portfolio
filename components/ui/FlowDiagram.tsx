import { Fragment } from "react";
import type { FlowNode } from "@/lib/content/projects";

/*
  A schematic flow, laid out in CSS rather than fixed SVG coordinates so it can
  wrap on narrow screens: horizontal with chevrons on desktop, vertical on mobile.
*/
export function FlowDiagram({ nodes, label }: { nodes: FlowNode[]; label: string }) {
  return (
    <figure className="m-0">
      <figcaption className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        {label}
      </figcaption>

      <div className="mt-3 flex flex-col items-stretch gap-0 md:flex-row md:items-stretch">
        {nodes.map((node, index) => (
          <Fragment key={node.label}>
            <div className="flex-1 border border-line bg-ground px-3.5 py-3">
              <p className="text-[13px] leading-tight text-ink">{node.label}</p>
              <p className="mt-1 text-[11px] leading-snug text-ink-faint">{node.note}</p>
            </div>

            {index < nodes.length - 1 ? (
              <div
                aria-hidden="true"
                className="flex items-center justify-center py-1 md:py-0"
              >
                <span className="connector-v h-4 w-px md:hidden" />
                <span className="hidden font-mono text-[11px] text-accent md:inline md:px-2">
                  →
                </span>
              </div>
            ) : null}
          </Fragment>
        ))}
      </div>
    </figure>
  );
}
