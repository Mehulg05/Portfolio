"use client";

import type LenisType from "lenis";
import { useEffect } from "react";
import { registerSmoothScroll } from "@/lib/smooth-scroll";

export function SmoothScroll() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: LenisType | null = null;
    let cancelled = false;

    // Kept out of the initial bundle — nothing in the first paint depends on it.
    const enable = async () => {
      if (lenis) return;
      document.documentElement.classList.add("js-motion");
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;
      lenis = new Lenis({
        duration: 1.05,
        autoRaf: true,
        // Header is sticky — land anchors below it.
        anchors: { offset: -72 },
      });
      // Published so a modal can pause the wheel while it holds the screen.
      registerSmoothScroll(lenis);
    };

    const disable = () => {
      document.documentElement.classList.remove("js-motion");
      lenis?.destroy();
      lenis = null;
      registerSmoothScroll(null);
    };

    if (media.matches) disable();
    else enable();

    const onChange = () => (media.matches ? disable() : enable());
    media.addEventListener("change", onChange);

    return () => {
      cancelled = true;
      media.removeEventListener("change", onChange);
      disable();
    };
  }, []);

  return null;
}
