"use client";

import { useEffect, type RefObject } from "react";
import { observeScrollProgress } from "@/lib/motion/scroll-progress";

/*
  Makes an element hang: scrolling nudges it into a small pendulum swing that settles
  back to rest. Rides the shared scroll listener for the kick, then runs its own rAF
  loop only while the element is still moving.
*/
export function useScrollSwing(
  ref: RefObject<HTMLElement | null>,
  { maxDegrees = 6, kick = 0.08, stiffness = 0.06, damping = 0.86 } = {},
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let angle = 0;
    let velocity = 0;
    let lastScrollY = window.scrollY;
    let frame = 0;

    const step = () => {
      frame = 0;
      // Spring towards rest, damped.
      velocity += -angle * stiffness;
      velocity *= damping;
      angle += velocity;

      if (Math.abs(angle) < 0.02 && Math.abs(velocity) < 0.02) {
        angle = 0;
        velocity = 0;
        element.style.transform = "";
        return;
      }
      element.style.transform = `rotate(${angle.toFixed(3)}deg)`;
      frame = requestAnimationFrame(step);
    };

    const stop = observeScrollProgress(element, () => {
      const delta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      // Scrolling down swings the card back (positive), up swings it forward.
      const push = Math.max(-maxDegrees, Math.min(maxDegrees, delta * kick));
      velocity += push * 0.5;
      if (!frame) frame = requestAnimationFrame(step);
    });

    return () => {
      stop();
      if (frame) cancelAnimationFrame(frame);
      element.style.transform = "";
    };
  }, [ref, maxDegrees, kick, stiffness, damping]);
}
