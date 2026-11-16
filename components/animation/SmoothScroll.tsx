"use client";

import { useEffect } from "react";
import { registerSmoothScroll } from "@/lib/smooth-scroll";

/*
  Off on purpose. Chrome, Edge, Firefox and Safari already ease a mouse wheel, and a
  trackpad brings its own momentum, so a second lerp on top only adds lag between the hand
  and the page. lib/motion/smooth-scroll.ts is kept, tested and ready behind this switch;
  the module is a separate chunk and is not downloaded while the switch is off.

  Anchor links need nothing from here: they are native, with scroll-margin-top in
  globals.css, so deep links, back/forward and keyboard focus all behave as the platform
  intends.
*/
const SMOOTH_WHEEL = false;

/* Desktop mice only: never touch, never narrow screens, never under reduced motion. */
const WHEEL_QUERY =
  "(prefers-reduced-motion: no-preference) and (min-width: 1024px) and (hover: hover) and (pointer: fine)";

export function SmoothScroll() {
  useEffect(() => {
    if (!SMOOTH_WHEEL) return;

    const media = window.matchMedia(WHEEL_QUERY);
    let destroy: (() => void) | null = null;
    let cancelled = false;

    const enable = async () => {
      if (destroy) return;
      const { createSmoothScroll } = await import("@/lib/motion/smooth-scroll");
      if (cancelled || destroy || !media.matches) return;
      const controller = createSmoothScroll();
      registerSmoothScroll(controller);
      destroy = () => {
        controller.destroy();
        registerSmoothScroll(null);
      };
    };

    const disable = () => {
      destroy?.();
      destroy = null;
    };

    const sync = () => (media.matches ? enable() : disable());
    sync();
    media.addEventListener("change", sync);

    return () => {
      cancelled = true;
      media.removeEventListener("change", sync);
      disable();
    };
  }, []);

  return null;
}
