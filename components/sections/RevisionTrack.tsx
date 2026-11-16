"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/animation/Reveal";
import { HOLDER_W, IdCardStatic } from "@/components/sections/IdCardStatic";
import { milestones } from "@/lib/content/milestones";
import { observeScrollProgress } from "@/lib/motion/scroll-progress";
import { useMotionEnabled } from "@/lib/motion/use-motion-enabled";

// The hanging card and its physics are desktop-and-motion only, so phones never fetch them.
const IdCard = dynamic(() => import("@/components/sections/IdCard").then((module) => module.IdCard), {
  ssr: false,
});

export function RevisionTrack() {
  const enabled = useMotionEnabled();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Array<HTMLDivElement | null>>([]);
  // Which step is being read, and whether the visitor scrolled down or up into it.
  const [active, setActive] = useState<{ index: number; direction: 1 | -1 }>({
    index: 0,
    direction: 1,
  });

  // Measuring every entry on every scroll frame is only worth it while the track is near.
  const [near, setNear] = useState(false);
  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;
    const observer = new IntersectionObserver(([entry]) => setNear(entry?.isIntersecting ?? false), {
      rootMargin: "200px 0px",
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [enabled]);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !near || !container) return;

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
  }, [enabled, near]);

  const current = milestones[active.index];

  return (
    <div ref={containerRef} className="mt-8 lg:grid lg:grid-cols-[1fr_240px] lg:gap-14">
      {/*
        Pinned column on the right, desktop and motion only: the ID card for the step
        you have scrolled to, hanging from the top of the viewport. Rendered first so the
        timeline stays the section's primary content in source order; `order` moves it
        visually. Decorative, and it repeats what each entry already says, so it is hidden
        from assistive technology.
      */}
      {enabled ? (
        <div aria-hidden="true" className="lg:order-2 lg:justify-self-end">
          <div className="sticky top-28" style={{ width: HOLDER_W }}>
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
              className={`absolute top-1 -left-[6px] h-[11px] w-[11px] rounded-full border-2 transition-opacity duration-500 ${
                enabled && index !== active.index ? "opacity-45" : ""
              } ${
                milestone.current
                  ? "border-accent bg-accent"
                  : "border-line-bright bg-ground"
              }`}
            />

            <div
              ref={(node) => {
                itemsRef.current[index] = node;
              }}
            >
              {/* Only the marker and period label recede; the text being read never dims. */}
              <p
                className={`label-mono ${
                  milestone.current || (enabled && index === active.index) ? "text-accent" : "text-ink-faint"
                }`}
              >
                {milestone.period}
              </p>

              <h3 className="mt-2 font-display text-xl tracking-tight text-ink sm:text-2xl">
                {milestone.title}
              </h3>

              <p className="mt-1 text-note text-ink-dim">{milestone.context}</p>

              <div className="measure mt-4 flex flex-col gap-3 text-body text-ink-dim">
                {milestone.story.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </div>

              {/* No pinned column below lg or without motion, so the card sits with its step. */}
              <div className="idcard-inline mt-5">
                <IdCardStatic milestone={milestone} />
              </div>
            </div>
          </Reveal>
        ))}
      </ol>
    </div>
  );
}
