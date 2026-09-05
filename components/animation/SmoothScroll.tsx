"use client";

import type LenisType from "lenis";
import { useEffect } from "react";

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
    };

    const disable = () => {
      document.documentElement.classList.remove("js-motion");
      lenis?.destroy();
      lenis = null;
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
