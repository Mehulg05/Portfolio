"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/animation/Reveal";
import { milestones } from "@/lib/content/milestones";
import { observeScrollProgress } from "@/lib/motion/scroll-progress";
import { useMotionEnabled } from "@/lib/motion/use-motion-enabled";

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

  const current = milestones[active];

  return (
    <div ref={containerRef} className="mt-14 lg:grid lg:grid-cols-[240px_1fr] lg:gap-14">
      {/*
        Pinned readout, desktop and motion only: when and where the step you have
        scrolled to happened, and a line of dots showing how far along you are.
      */}
      {enabled ? (
        <div>
          <div className="sticky top-28">
            <p className="font-display text-3xl leading-tight tracking-tight text-accent tabular-nums">
              {current.period}
            </p>
            <p className="mt-2 text-sm text-ink">{current.title}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              {current.context}
            </p>

            <div className="relative mt-7 h-44 w-px bg-line">
              <div
                ref={fillRef}
                className="absolute inset-0 origin-top bg-accent"
                style={{ transform: "scaleY(0)" }}
              />
              {milestones.map((milestone, index) => (
                <span
                  key={milestone.id}
                  aria-hidden="true"
                  className={`absolute -left-[4px] h-2 w-2 -translate-y-1/2 rounded-full ${
                    index <= active ? "bg-accent" : "bg-line-bright"
                  }`}
                  style={{ top: `${(index / (milestones.length - 1)) * 100}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <ol className="border-l border-line">
        {milestones.map((milestone, index) => (
          <Reveal
            as="li"
            key={milestone.id}
            className="relative pb-12 pl-6 last:pb-0 sm:pl-10"
          >
            <span
              aria-hidden="true"
              className={`absolute top-1 -left-[6px] h-[11px] w-[11px] rounded-full border-2 ${
                milestone.current
                  ? "border-accent bg-accent"
                  : "border-line-bright bg-ground"
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
              <p
                className={`font-mono text-[11px] uppercase tracking-[0.14em] ${
                  milestone.current ? "text-accent" : "text-ink-faint"
                }`}
              >
                {milestone.period}
              </p>

              <h3 className="mt-2 font-display text-xl tracking-tight text-ink sm:text-2xl">
                {milestone.title}
              </h3>

              <p className="mt-1.5 font-mono text-[11px] text-ink-faint">{milestone.context}</p>

              <div className="mt-4 flex max-w-[64ch] flex-col gap-3 text-[15px] leading-relaxed text-ink-dim sm:text-[16px]">
                {milestone.story.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
