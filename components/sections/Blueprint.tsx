"use client";

import { useState, type CSSProperties } from "react";
import { Reveal } from "@/components/animation/Reveal";
import type { BlueprintBlock, BlueprintRow } from "@/lib/content/experience";

/*
  A role's work as a schematic. Rows of blocks; a `flow` row joins them with connectors
  that draw themselves as the drawing scrolls into view, a `lanes` row leaves them side
  by side. Hovering, focusing or tapping a block prints its note in the readout line
  above the drawing, the same pattern the skills map uses, so the page never grows or
  shifts under the pointer.

  Every block is a button so keyboard and screen-reader users reach the same note; the
  note is also in the button as screen-reader text, so the readout is purely visual.
*/

type Props = {
  label: string;
  rows: BlueprintRow[];
};

export function Blueprint({ label, rows }: Props) {
  const [shown, setShown] = useState<BlueprintBlock | null>(null);
  // Tapped on a touch screen: stays until tapped again, since there is no hover to leave.
  const [pinned, setPinned] = useState<BlueprintBlock | null>(null);

  const current = shown ?? pinned;
  let step = 0;

  return (
    <Reveal as="div" className="blueprint mt-6 border-t border-line pt-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">{label}</p>

      <div
        aria-hidden="true"
        className="mt-3 flex min-h-[2.25rem] items-center gap-3 border border-accent/40 border-l-2 border-l-accent bg-accent-deep/25 px-3 py-1.5 text-[13px] leading-snug text-ink"
      >
        {current ? (
          <>
            <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
              {current.label}
            </span>
            <span className="text-ink-faint">·</span>
            <span>{current.note}</span>
          </>
        ) : (
          <span className="text-ink-dim">Hover or tap a block to see what I did there.</span>
        )}
      </div>

      {/*
        Flow rows are vertical chains, side by side when there are two, so seven steps fit
        a half-width card at any viewport. Lanes rows sit full width underneath.
      */}
      <div className="mt-3 grid gap-x-5 gap-y-4 sm:grid-cols-2">
        {rows
          .filter((row) => row.mode === "flow")
          .map((row) => (
            <div key={row.label} className="min-w-0">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                {row.label}
              </p>
              <ol className="flex flex-col">
                {row.blocks.map((block, index) => {
                  const i = step++;
                  return (
                    <li key={block.label} className="flex flex-col">
                      <Block
                        block={block}
                        index={index}
                        step={i}
                        current={current === block}
                        pinned={pinned === block}
                        onShow={setShown}
                        onPin={() => setPinned((p) => (p === block ? null : block))}
                      />
                      {index < row.blocks.length - 1 ? (
                        <span
                          aria-hidden="true"
                          style={{ "--i": i } as CSSProperties}
                          className="bp-link ml-[1.35rem] h-3 w-px"
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ol>
              {row.span ? <Span text={row.span} step={step++} /> : null}
            </div>
          ))}
      </div>

      {rows
        .filter((row) => row.mode === "lanes")
        .map((row) => (
          <div key={row.label} className="mt-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              {row.label}
            </p>
            <ul className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-3">
              {row.blocks.map((block) => {
                const i = step++;
                return (
                  <li key={block.label} className="flex">
                    <Block
                      block={block}
                      step={i}
                      current={current === block}
                      pinned={pinned === block}
                      onShow={setShown}
                      onPin={() => setPinned((p) => (p === block ? null : block))}
                    />
                  </li>
                );
              })}
            </ul>
            {row.span ? <Span text={row.span} step={step++} /> : null}
          </div>
        ))}
    </Reveal>
  );
}

function Block({
  block,
  index,
  step,
  current,
  pinned,
  onShow,
  onPin,
}: {
  block: BlueprintBlock;
  /** Position in a flow; lanes have no order and pass none. */
  index?: number;
  step: number;
  current: boolean;
  pinned: boolean;
  onShow: (block: BlueprintBlock | null) => void;
  onPin: () => void;
}) {
  const numbered = index !== undefined;
  return (
    <button
      type="button"
      onMouseEnter={() => onShow(block)}
      onMouseLeave={() => onShow(null)}
      onFocus={() => onShow(block)}
      onBlur={() => onShow(null)}
      onClick={onPin}
      aria-pressed={pinned}
      style={{ "--i": step } as CSSProperties}
      className={`bp-block flex min-h-10 w-full items-center gap-2.5 border px-3 py-2 text-left transition-colors ${
        numbered ? "" : "min-h-11"
      } ${current ? "border-accent bg-surface-2" : "border-line bg-ground hover:bg-surface"}`}
    >
      {numbered ? (
        <span className="w-4 shrink-0 font-mono text-[10px] tabular-nums text-accent">
          {String(index + 1).padStart(2, "0")}
        </span>
      ) : null}
      <span className="text-[13px] leading-tight text-ink">{block.label}</span>
      <span className="sr-only">. {block.note}</span>
    </button>
  );
}

function Span({ text, step }: { text: string; step: number }) {
  return (
    <div style={{ "--i": step } as CSSProperties} className="bp-block mt-2 flex items-center gap-2 px-1">
      <span aria-hidden="true" className="h-2 w-2 shrink-0 border-b border-l border-accent/60" />
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint">{text}</span>
      <span aria-hidden="true" className="h-2 w-2 shrink-0 border-r border-b border-accent/60" />
    </div>
  );
}
