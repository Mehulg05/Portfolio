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
      // Anchors are handled below, not by Lenis, so both paths land in the same place.
      lenis = new Lenis({ duration: 1.05, autoRaf: true });
      // Published so a modal can pause the wheel while it holds the screen.
      registerSmoothScroll(lenis);
    };

    const disable = () => {
      document.documentElement.classList.remove("js-motion");
      lenis?.destroy();
      lenis = null;
      registerSmoothScroll(null);
    };

    /*
      In-page links land on the section's heading, just under the sticky header. Aiming at
      the section itself left its top padding (80–112px) as empty space above the heading.
    */
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const id = link?.getAttribute("href")?.slice(1);
      const section = id ? document.getElementById(id) : null;
      // #top is the skip link: left native so keyboard focus moves with it.
      if (!link || !id || !section || id === "top") return;
      event.preventDefault();

      const heading = section.querySelector("header, h2") ?? section;
      const bar = document.querySelector("header.sticky")?.getBoundingClientRect().height ?? 0;
      const top = heading.getBoundingClientRect().top + window.scrollY - bar - 16;

      if (lenis) lenis.scrollTo(top);
      else window.scrollTo({ top, behavior: media.matches ? "auto" : "smooth" });
      history.pushState(null, "", `#${id}`);
    };
    document.addEventListener("click", onClick);

    if (media.matches) disable();
    else enable();

    const onChange = () => (media.matches ? disable() : enable());
    media.addEventListener("change", onChange);

    return () => {
      cancelled = true;
      document.removeEventListener("click", onClick);
      media.removeEventListener("change", onChange);
      disable();
    };
  }, []);

  return null;
}
