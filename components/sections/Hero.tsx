import type { CSSProperties } from "react";
import { HeroPortrait } from "@/components/sections/HeroPortrait";
import { SheetSketch } from "@/components/sections/SheetSketch";
import { profile } from "@/lib/content/profile";

// The facts a screener checks first, in the order they check them.
const titleBlock = [
  { label: "Now", value: "Developer Trainee, Sahayogi One", detail: "Jun 2026 – present" },
  { label: "Before", value: "Full Stack Developer Intern, RBH Solutions", detail: "Jun – Jul 2025" },
  { label: "Studying", value: "B.Tech CSE, Bennett University", detail: `2023 – ${profile.graduation}` },
  { label: "Research", value: "Wheat-yield prediction from hyperspectral data", detail: "Manuscript under review" },
];

const nameLines = profile.name.toUpperCase().split(" ");

export function Hero() {
  return (
    <section
      id="top"
      aria-label="Introduction"
      className="hero-section relative overflow-hidden border-b border-line"
    >
      <div className="sheet-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="sheet-grid-bright" aria-hidden="true" />
      <SheetSketch />

      <div className="relative mx-auto max-w-6xl px-5 pt-6 pb-14 sm:px-8 sm:pt-10 sm:pb-20">

        {/*
          One grid, so nothing leaves an empty band: the left column runs name, claim,
          summary and both buttons straight down, the portrait holds the right column.
          Below lg the portrait sits beside the name and the rest follows full width, so a
          phone reaches the intro without scrolling past a full-width photo. The buttons
          must clear the fold at 1440x900.
        */}
        <div className="hero-stage relative mt-4 grid grid-cols-[minmax(0,1fr)_40%] items-end gap-x-4 gap-y-6 sm:mt-10 sm:gap-x-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-start lg:gap-x-12 lg:gap-y-6">
          <h1
            className="hero-name hero-rise col-start-1 row-start-1 self-center lg:self-auto"
            style={{ "--step": 2 } as CSSProperties}
          >
            {nameLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>

          <div
            className="hero-rise col-start-2 row-start-1 flex justify-end lg:row-span-4 lg:row-start-1"
            style={{ "--step": 3 } as CSSProperties}
          >
            <HeroPortrait />
          </div>

          {/*
            The name above is the page h1, so the intro is a paragraph. It rises with the
            summary so the sentence that says what this page is can be read at once.
          */}
          <p
            className="hero-rise relative z-10 col-span-2 max-w-[30ch] font-display text-[2rem] leading-[1.05] tracking-tight text-ink sm:text-[2.4rem] lg:col-span-1 lg:text-[2.6rem]"
            style={{ "--step": 4 } as CSSProperties}
          >
            {profile.intro}
          </p>

          <p
            className="hero-rise relative z-10 col-span-2 max-w-[54ch] text-base leading-relaxed text-ink-dim sm:text-lg lg:col-span-1"
            style={{ "--step": 5 } as CSSProperties}
          >
            {profile.summary}
          </p>

          {/* Two ways on: the strongest proof on the page, and a way to reach Mehul. */}
          <div
            className="hero-rise relative z-10 col-span-2 flex flex-wrap items-center gap-3 lg:col-span-1"
            style={{ "--step": 6 } as CSSProperties}
          >
            <a
              href="#client-work"
              className="inline-flex min-h-11 items-center bg-accent px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ground hover:bg-ink"
            >
              See the client work
            </a>
            <a
              href="#contact"
              className="inline-flex min-h-11 items-center border border-line-bright px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-dim hover:border-accent hover:text-accent"
            >
              Get in touch
            </a>
            <p className="w-full font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint sm:w-auto sm:pl-2">
              Open to {profile.openTo} · {profile.graduation} · {profile.location}
            </p>
          </div>
        </div>

        {/* Title block: the stamp in the corner of an engineering drawing. */}
        <dl
          className="hero-rise relative z-10 mt-12 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4"
          style={{ "--step": 7 } as CSSProperties}
        >
          {titleBlock.map((item) => (
            <div key={item.label} className="hero-stat border border-transparent bg-ground px-4 py-3.5">
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                {item.label}
              </dt>
              <dd className="mt-1.5 text-sm text-ink">{item.value}</dd>
              <dd className="mt-1 font-mono text-[11px] text-ink-faint">{item.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
