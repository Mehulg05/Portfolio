"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

/*
  Two stacked copies of the portrait: greyscale underneath, full colour on top with a
  radial mask centred on the cursor. The listener sits on the whole hero section, so the
  section responds wherever the cursor is and colour only appears where the circle
  overlaps the figure. Positions are written to CSS custom properties inside a rAF —
  no React state, so a mousemove never triggers a re-render.
*/
export function HeroPortrait() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const section = root?.closest("section");
    if (!root || !section) return;

    /*
      No fine hover means no spotlight. CSS shows those devices the colour image instead,
      after a one-off scan-in when motion is allowed. The scan waits for this attribute,
      set once the image has really loaded; a stalled image releases the greyscale hold
      without animating rather than sweeping an empty box.
    */
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const image = root.querySelector<HTMLImageElement>(".hero-portrait-base");
      if (!image) return;
      const start = () => {
        if (!root.hasAttribute("data-scan")) root.dataset.scan = "run";
      };
      const giveUp = window.setTimeout(() => {
        if (!root.hasAttribute("data-scan")) root.dataset.scan = "skip";
      }, 4000);
      if (image.complete && image.naturalWidth > 0) start();
      else image.addEventListener("load", start, { once: true });
      return () => {
        window.clearTimeout(giveUp);
        image.removeEventListener("load", start);
      };
    }

    let frame = 0;
    let clientX = 0;
    let clientY = 0;

    const apply = () => {
      frame = 0;
      const portrait = root.getBoundingClientRect();
      root.style.setProperty("--mx", `${clientX - portrait.left}px`);
      root.style.setProperty("--my", `${clientY - portrait.top}px`);

      const bounds = section.getBoundingClientRect();
      section.style.setProperty("--gx", `${clientX - bounds.left}px`);
      section.style.setProperty("--gy", `${clientY - bounds.top}px`);
    };

    const onMove = (event: PointerEvent) => {
      clientX = event.clientX;
      clientY = event.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onEnter = () => section.classList.add("is-lit");
    const onLeave = () => section.classList.remove("is-lit");

    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerenter", onEnter);
    section.addEventListener("pointerleave", onLeave);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerenter", onEnter);
      section.removeEventListener("pointerleave", onLeave);
      section.classList.remove("is-lit");
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="hero-portrait relative w-[72%] max-w-[380px] sm:w-[55%] lg:w-full lg:max-w-none"
    >
      <Image
        src="/mehul-cutout.png"
        alt="Mehul Gupta, in a black suit."
        width={690}
        height={770}
        quality={90}
        priority
        sizes="(min-width: 1024px) 380px, (min-width: 640px) 55vw, 72vw"
        className="hero-portrait-base h-auto w-full"
      />
      <Image
        src="/mehul-cutout.png"
        alt=""
        aria-hidden="true"
        width={690}
        height={770}
        quality={90}
        priority
        sizes="(min-width: 1024px) 380px, (min-width: 640px) 55vw, 72vw"
        className="hero-portrait-colour absolute inset-0 h-auto w-full"
      />
    </div>
  );
}
