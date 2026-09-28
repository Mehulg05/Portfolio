"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/animation/Reveal";
import { IdCard } from "@/components/sections/IdCard";
import { milestones } from "@/lib/content/milestones";
import { observeScrollProgress } from "@/lib/motion/scroll-progress";
import { useMotionEnabled } from "@/lib/motion/use-motion-enabled";

export function RevisionTrack() {
  const enabled = useMotionEnabled();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Array<HTMLDivElement | null>>([]);
  // Which step is being read, and whether the visitor scrolled down or up into it.
  const [active, setActive] = useState<{ index: number; direction: 1 | -1 }>({
    index: 0,
    direction: 1,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    const readLine = 0.45;

    return observeScrollProgress(
      container,
      () => {
        // The entry whose top most recently crossed the same reading line.
        const line = window.innerHeight * readLine;
        let next = 0;
        itemsRef.current.forEach((element, index) => {
          if (element && element.getBoundingClientRect().top <= line) next = index;
        });
        setActive((previous) =>
          previous.index === next
            ? previous
            : { index: next, direction: next > previous.index ? 1 : -1 },
        );
      },
      { readLine },
    );
  }, [enabled]);

  const current = milestones[active.index];

  return (
    <div ref={containerRef} className="mt-14 lg:grid lg:grid-cols-[1fr_240px] lg:gap-14">
      {/*
        Pinned column on the right, desktop and motion only: the ID card for the step
        you have scrolled to, hanging from the top of the viewport. Rendered first so the timeline stays the
        section's primary content in source order; `order` moves it visually.
      */}
      {enabled ? (
        <div className="lg:order-2 lg:justify-self-end">
          <div className="sticky top-28 w-[208px]">
            <IdCard milestone={current} direction={active.direction} />
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
                      index === active.index ? "opacity-100" : "opacity-45"
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
