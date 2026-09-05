"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/animation/Reveal";
import type { ChangeKind } from "@/lib/content/milestones";
import { bumpRule, changeLabels, revisions } from "@/lib/content/milestones";
import { observeScrollProgress } from "@/lib/motion/scroll-progress";
import { useMotionEnabled } from "@/lib/motion/use-motion-enabled";

const kindStyles: Record<ChangeKind, { label: string; dot: string }> = {
  breaking: { label: "text-redline", dot: "bg-redline" },
  added: { label: "text-accent", dot: "bg-accent" },
  removed: { label: "text-ink-faint", dot: "bg-line-bright" },
};

/** How many beliefs had broken by the time you reached this entry. */
function breaksThrough(index: number) {
  return revisions
    .slice(0, index + 1)
    .filter((revision) => revision.changes.some((change) => change.kind === "breaking"))
    .length;
}

export function RevisionTrack() {
  const enabled = useMotionEnabled();
  const containerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Array<HTMLDivElement | null>>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    const readLine = 0.45;

    return observeScrollProgress(
      container,
      (progress) => {
        if (fillRef.current) {
          fillRef.current.style.transform = `scaleY(${progress})`;
        }

        // The entry whose top most recently crossed the same reading line.
        const line = window.innerHeight * readLine;
        let next = 0;
        itemsRef.current.forEach((element, index) => {
          if (element && element.getBoundingClientRect().top <= line) next = index;
        });
        setActive((previous) => (previous === next ? previous : next));
      },
      { readLine },
    );
  }, [enabled]);

  const current = revisions[active];
  const breaks = breaksThrough(active);

  return (
    <div ref={containerRef} className="mt-14 lg:grid lg:grid-cols-[240px_1fr] lg:gap-14">
      {/*
        Pinned readout — desktop only, motion only. It deliberately shows what the list
        cannot: the rule the version numbers follow, and how many beliefs have broken
        by the point you have scrolled to.
      */}
      {enabled ? (
        <div>
          <div className="sticky top-28">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
              At this revision
            </p>
            <p className="mt-3 font-display text-5xl tracking-tight text-accent tabular-nums">
              {current.version}
            </p>

            {/* The denominator excludes v0.1 — the initial commit had nothing to break. */}
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              <span className="text-redline tabular-nums">{breaks}</span> of{" "}
              <span className="tabular-nums">{revisions.length - 1}</span> revisions
              <br />
              broke something
            </p>

            {/* Spine. Tick size encodes the bump: a major break reads heavier. */}
            <div className="relative mt-7 h-44 w-px bg-line">
              <div
                ref={fillRef}
                className="absolute inset-0 origin-top bg-accent"
                style={{ transform: "scaleY(0)" }}
              />
              {revisions.map((revision, index) => {
                const major = revision.bump === "major";
                const reached = index <= active;
                return (
                  <span
                    key={revision.version}
                    aria-hidden="true"
                    className={`absolute ${
                      major ? "-left-[4px] h-2 w-2" : "-left-[2.5px] h-1 w-1"
                    } ${
                      reached
                        ? major
                          ? "bg-redline"
                          : "bg-accent"
                        : "bg-line-bright"
                    }`}
                    style={{ top: `${(index / (revisions.length - 1)) * 100}%` }}
                  />
                );
              })}
            </div>

            <dl className="mt-7 border-t border-line pt-4 font-mono text-[10px] uppercase tracking-[0.12em]">
              {bumpRule.map((rule) => (
                <div key={rule.label} className="flex gap-2 py-1">
                  <dt className="shrink-0 text-ink-dim">{rule.label}</dt>
                  <dd className="text-ink-faint">{rule.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : null}

      <ol className="border-l border-line">
        {revisions.map((revision, index) => (
          <Reveal
            as="li"
            key={revision.version}
            className="relative pb-12 pl-6 last:pb-0 sm:pl-10"
          >
            <span
              aria-hidden="true"
              className={`absolute top-1.5 -left-[4px] h-2 w-2 ${
                revision.current
                  ? "bg-accent"
                  : revision.bump === "major"
                    ? "bg-redline"
                    : "bg-line-bright"
              }`}
            />

            <div
              ref={(node) => {
                itemsRef.current[index] = node;
              }}
              className={
                enabled
                  ? `transition-opacity duration-500 ${
                      index === active ? "opacity-100" : "opacity-45"
                    }`
                  : undefined
              }
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em]">
                <span className={revision.current ? "text-accent" : "text-ink-dim"}>
                  {revision.version}
                </span>
                <span className="text-ink-faint">{revision.period}</span>
                {revision.bump === "major" ? (
                  <span className="border border-redline/45 px-1.5 py-0.5 text-[10px] text-redline">
                    Major
                  </span>
                ) : null}
              </div>

              <h3 className="mt-3 font-display text-xl tracking-tight text-ink sm:text-2xl">
                {revision.title}
              </h3>

              <p className="mt-1.5 font-mono text-[11px] text-ink-faint">
                {revision.context}
              </p>

              <ul className="mt-4 flex flex-col gap-3">
                {revision.changes.map((change) => (
                  <li key={change.text} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className={`mt-[9px] h-1 w-1 shrink-0 ${kindStyles[change.kind].dot}`}
                    />
                    <p className="max-w-[62ch] text-[15px] leading-relaxed text-ink-dim">
                      <span
                        className={`mr-2 font-mono text-[11px] uppercase tracking-[0.12em] ${kindStyles[change.kind].label}`}
                      >
                        {changeLabels[change.kind]}
                      </span>
                      {/* Explicit space — without it the label and text concatenate
                          in the accessibility tree ("AddedC++, data structures"). */}
                      {" "}
                      {change.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
