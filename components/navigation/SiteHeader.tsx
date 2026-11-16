"use client";

import { useEffect, useRef, useState } from "react";
import { LinkButton } from "@/components/ui/LinkButton";
import { profile } from "@/lib/content/profile";
import { sections } from "@/lib/content/sections";
import { observeScrollProgress, refreshScrollProgress } from "@/lib/motion/scroll-progress";

const navSections = sections.slice(1);

// A section becomes current once its top crosses this fraction of the viewport.
const READ_LINE = 0.35;

export function SiteHeader() {
  const [activeId, setActiveId] = useState<string>(sections[0].id);
  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const tickRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    const body = document.body;

    /*
      The scroll position at which each section becomes current: its top crossing the
      reading line. Measured on layout changes only, so a scroll frame reads one number
      (scrollY) instead of one rect per section, and the ticks and the nav label cannot
      disagree. clientHeight rather than innerHeight, as before, so pinch-zoom and a
      horizontal scrollbar do not move the line.
    */
    let lines: number[] = [];

    const layout = () => {
      const root = document.documentElement;
      const viewport = root.clientHeight;
      const travel = root.scrollHeight - viewport;

      lines = navSections.map(({ id }) => {
        const element = document.getElementById(id);
        if (!element) return Infinity;
        return element.getBoundingClientRect().top + window.scrollY - viewport * READ_LINE;
      });

      tickRefs.current.forEach((tick, index) => {
        if (!tick) return;
        const stop = travel > 0 ? lines[index] / travel : Infinity;
        // A section that can never reach the line gets no tick, not one parked at the end.
        const placed = stop <= 1;
        tick.toggleAttribute("data-placed", placed);
        // Held 1px inside the ruler, so the last tick can never widen the page.
        if (placed) tick.style.left = `min(${Math.max(0, stop) * 100}%, 100% - 1px)`;
      });
    };

    // Progress is written straight to the DOM. Only the nav label goes through React.
    const paint = (progress: number) => {
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${progress})`;

      const y = window.scrollY;
      let current = -1;
      lines.forEach((line, index) => {
        if (y >= line) current = index;
      });
      // A last section shorter than the space under the reading line can never cross it;
      // at the bottom of the page it is the one being read.
      const root = document.documentElement;
      if (root.scrollHeight > root.clientHeight && y >= root.scrollHeight - root.clientHeight - 1) current = navSections.length - 1;

      tickRefs.current.forEach((tick, index) => {
        tick?.toggleAttribute("data-passed", index <= current);
        tick?.toggleAttribute("data-current", index === current);
      });

      // Unchanged between most frames, and React skips the render when it is.
      setActiveId(current < 0 ? sections[0].id : navSections[current].id);
    };

    // Anchor targets land under the header by this much (scroll-margin-top in globals.css).
    const publishHeight = () => {
      const height = headerRef.current?.getBoundingClientRect().height;
      if (height) document.documentElement.style.setProperty("--header-h", `${Math.round(height)}px`);
    };

    // A disclosure opening or a pinned section changing height moves every section below it.
    const resizeObserver = new ResizeObserver(() => {
      publishHeight();
      layout();
      refreshScrollProgress();
    });
    // The reading line and the travel both depend on the viewport height.
    const onResize = () => layout();

    layout();
    const unsubscribe = observeScrollProgress(body, paint);
    resizeObserver.observe(body);
    if (headerRef.current) resizeObserver.observe(headerRef.current);
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);

    return () => {
      unsubscribe();
      resizeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, []);

  /*
    A hash link scrolls but leaves focus where it was, so the next Tab would start from the
    link instead of the section just reached. Move focus to the target without scrolling
    again; sections are not otherwise focusable, hence tabindex="-1".
  */
  useEffect(() => {
    const onHashChange = () => {
      const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
      if (!target) return;
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  /*
    Below lg the nav is a row that scrolls sideways. Keep the current section's link in
    that row's view, or a phone visitor reading Research sees only "Experience · Client
    Work" with nothing highlighted.
  */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || nav.scrollWidth <= nav.clientWidth) return;
    const link = nav.querySelector<HTMLElement>(`a[href="#${activeId}"]`);
    if (!link) return;
    // Measured against the row itself: the link's offsetParent is the sticky header.
    const row = nav.getBoundingClientRect();
    const box = link.getBoundingClientRect();
    if (box.left >= row.left && box.right <= row.right) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nav.scrollTo({
      left: nav.scrollLeft + box.left - row.left - 8,
      behavior: reduced ? "auto" : "smooth",
    });
  }, [activeId]);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 border-b border-line bg-ground/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-1.5 sm:px-8 lg:gap-6 lg:py-3">
        {/*
          Below lg the same links sit in one row that scrolls sideways, so a phone gets a
          section menu too. Links are 44px tall there for touch; on desktop they shrink back.
          The row fades out at its right edge while more links sit past it, so the cut-off
          reads as "scroll for more" rather than the end of the menu.
        */}
        <nav
          ref={navRef}
          aria-label="Sections"
          className="nav-scroll -ml-2 min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] lg:ml-0 lg:flex-none lg:overflow-visible [scroll-padding-inline:2.5rem] [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex items-center gap-1 whitespace-nowrap lg:gap-5">
            {navSections.map((section) => {
              const isActive = section.id === activeId;
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`inline-flex min-h-11 items-center px-2 font-mono text-[11px] uppercase tracking-[0.14em] focus-visible:-outline-offset-2 lg:min-h-0 lg:px-0 lg:focus-visible:outline-offset-4 ${
                      isActive ? "text-accent" : "text-ink-faint hover:text-ink"
                    }`}
                  >
                    {section.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-5">
          <LinkButton href={profile.resume} newTab context="one page PDF">
            Resume
          </LinkButton>
        </div>
      </div>

      {/*
        A ruler, not just a bar: one tick where each section becomes current. Ticks light
        once passed and the current one stands taller. Hidden until measured, so nothing
        stacks at the left edge before the first layout.
      */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-px overflow-x-clip">
        <div
          ref={fillRef}
          className="absolute inset-0 origin-left bg-accent"
          style={{ transform: "scaleX(0)" }}
        />
        {navSections.map((section, index) => (
          <span
            key={section.id}
            ref={(node) => {
              tickRefs.current[index] = node;
            }}
            className="absolute bottom-0 hidden h-[9px] w-px origin-bottom scale-y-[0.5556] bg-line-bright data-[current]:scale-y-100 data-[passed]:bg-accent data-[placed]:block motion-safe:transition-[transform,background-color] motion-safe:duration-200"
          />
        ))}
      </div>
    </header>
  );
}
