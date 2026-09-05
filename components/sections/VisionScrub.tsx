"use client";

import { useEffect, useRef } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { vision } from "@/lib/content/roadmap";
import { observeScrollProgress } from "@/lib/motion/scroll-progress";
import { useMotionEnabled } from "@/lib/motion/use-motion-enabled";

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function VisionScrub() {
  const enabled = useMotionEnabled();
  const containerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const paragraphsRef = useRef<Array<HTMLParagraphElement | null>>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    const count = vision.body.length;

    return observeScrollProgress(container, (progress) => {
      if (backdropRef.current) {
        backdropRef.current.style.opacity = String(0.3 + progress * 0.7);
      }

      paragraphsRef.current.forEach((paragraph, index) => {
        if (!paragraph) return;
        const local = clamp01((progress * (count + 0.8) - index) / 0.8);
        paragraph.style.opacity = String(local);
        paragraph.style.transform = `translateY(${(1 - local) * 14}px)`;
      });
    });
  }, [enabled]);

  return (
    <div ref={containerRef} className={enabled ? "relative h-[200vh]" : "relative"}>
      <div
        ref={backdropRef}
        className="sheet-grid pointer-events-none absolute inset-0"
        aria-hidden="true"
      />

      <div
        className={
          enabled ? "sticky top-0 flex min-h-screen items-center" : undefined
        }
      >
        <div className="relative mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <SectionHeader index="08" label="Roadmap" title="Where this is going" />

          <p className="mt-12 max-w-[20ch] font-display text-[2.1rem] leading-[1.05] tracking-tight text-ink sm:text-5xl">
            {vision.statement}
          </p>

          <div className="mt-8 flex max-w-[64ch] flex-col gap-5 text-[15px] leading-relaxed text-ink-dim sm:text-base">
            {vision.body.map((paragraph, index) => (
              <p
                key={paragraph.slice(0, 24)}
                ref={(node) => {
                  paragraphsRef.current[index] = node;
                }}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
