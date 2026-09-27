"use client";

import { useEffect, useRef, useState } from "react";
import { LinkButton } from "@/components/ui/LinkButton";
import { profile } from "@/lib/content/profile";
import { projects } from "@/lib/content/projects";
import { observeScrollProgress, refreshScrollProgress } from "@/lib/motion/scroll-progress";

const sections = [
  { id: "top", index: "01", label: "Top" },
  { id: "experience", index: "02", label: "Experience" },
  { id: "research", index: "03", label: "Research" },
  // Only once a live project exists. The section renders nothing before then.
  ...(projects.length > 0 ? [{ id: "projects", index: "03", label: "Projects" }] : []),
  { id: "system-map", index: "04", label: "Skills" },
  { id: "revision-history", index: "05", label: "Timeline" },
  { id: "education", index: "07", label: "Education" },
  { id: "contact", index: "08", label: "Contact" },
];

const navSections = sections.slice(1);

// A section becomes current once its top crosses this fraction of the viewport.
const READ_LINE = 0.35;

export function SiteHeader() {
  const [activeId, setActiveId] = useState(sections[0].id);
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

      tickRefs.current.forEach((tick, index) => {
        tick?.toggleAttribute("data-passed", index <= current);
        tick?.toggleAttribute("data-current", index === current);
      });

      // Unchanged between most frames, and React skips the render when it is.
      setActiveId(current < 0 ? sections[0].id : navSections[current].id);
    };

    // A disclosure opening or a pinned section changing height moves every section below it.
    const resizeObserver = new ResizeObserver(() => {
      layout();
      refreshScrollProgress();
    });
    // The reading line and the travel both depend on the viewport height.
    const onResize = () => layout();

    layout();
    const unsubscribe = observeScrollProgress(body, paint);
    resizeObserver.observe(body);
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);

    return () => {
      unsubscribe();
      resizeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ground/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-1.5 sm:px-8 lg:gap-6 lg:py-3">
        {/*
          Below lg the same links sit in one row that scrolls sideways, so a phone gets a
          section menu too. Links are 44px tall there for touch; on desktop they shrink back.
        */}
        <nav
          aria-label="Sections"
          className="-ml-2 min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] lg:ml-0 lg:flex-none lg:overflow-visible [&::-webkit-scrollbar]:hidden"
        >
          <ul className="flex items-center gap-1 whitespace-nowrap lg:gap-5">
            {navSections.map((section) => {
              const isActive = section.id === activeId;
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`inline-flex min-h-11 items-center px-2 font-mono text-[11px] uppercase tracking-[0.14em] lg:min-h-0 lg:px-0 ${
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
            className="absolute bottom-0 hidden h-[5px] w-px bg-line-bright data-[current]:h-[9px] data-[passed]:bg-accent data-[placed]:block motion-safe:transition-[height,background-color] motion-safe:duration-200"
          />
        ))}
      </div>
    </header>
  );
}
