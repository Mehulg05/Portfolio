"use client";

import { useEffect, useState } from "react";
import { LinkButton } from "@/components/ui/LinkButton";
import { profile } from "@/lib/content/profile";

const sections = [
  { id: "top", index: "01", label: "Top" },
  { id: "revision-history", index: "02", label: "History" },
  { id: "system-map", index: "03", label: "Stack" },
  { id: "experience", index: "04", label: "Experience" },
  { id: "case-files", index: "05", label: "Projects" },
  { id: "roadmap", index: "06", label: "Roadmap" },
  { id: "contact", index: "07", label: "Contact" },
];

const navSections = sections.slice(1);

export function SiteHeader() {
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState(sections[0].id);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      setProgress(scrollable > 0 ? Math.min(1, doc.scrollTop / scrollable) : 0);

      // The section whose top has most recently crossed the upper third.
      const line = doc.clientHeight * 0.35;
      let current = sections[0].id;
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element && element.getBoundingClientRect().top <= line) {
          current = section.id;
        }
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const active = sections.find((section) => section.id === activeId) ?? sections[0];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ground/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3 sm:px-8">
        <a
          href="#top"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink hover:text-accent"
        >
          MG<span className="text-ink-faint"> / build log</span>
        </a>

        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="flex items-center gap-5">
            {navSections.map((section) => {
              const isActive = section.id === activeId;
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={isActive ? "true" : undefined}
                    className={`font-mono text-[11px] uppercase tracking-[0.14em] ${
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

        <div className="flex items-center gap-5">
          <span
            aria-hidden="true"
            className="hidden font-mono text-[11px] tracking-[0.14em] text-ink-faint tabular-nums lg:inline"
          >
            §{active.index} · {Math.round(progress * 100)}%
          </span>
          <LinkButton href={profile.resume} newTab context="one page PDF">
            Résumé
          </LinkButton>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-accent"
        style={{ transform: `scaleX(${progress})` }}
      />
    </header>
  );
}
