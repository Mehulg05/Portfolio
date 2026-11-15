"use client";

import { useLayoutEffect, useRef } from "react";

/*
  A number that counts up from zero the first time it scrolls into view.

  The server render, no-JS visitors and reduced motion all get the final value as plain
  text. The count writes straight to the DOM, so it never re-renders React. The layout
  effect sets "0" before the first paint, so a remount (a tab switch) never flashes the
  final value first. Screen readers get the final value once, from the sr-only copy.
*/
export function CountUp({
  value,
  suffix = "",
  duration = 900,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!document.documentElement.classList.contains("js-motion")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    node.textContent = "0";

    const run = () => {
      const startedAt = performance.now();
      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        node.textContent = String(Math.round(value * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      node.textContent = String(value);
    };
  }, [value, duration]);

  return (
    <span className="tabular-nums">
      <span ref={ref} aria-hidden="true">
        {value}
      </span>
      <span aria-hidden="true">{suffix}</span>
      <span className="sr-only">
        {value}
        {suffix}
      </span>
    </span>
  );
}
