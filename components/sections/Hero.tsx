import { Fragment, type CSSProperties } from "react";
import { HeroPortrait } from "@/components/sections/HeroPortrait";
import { SheetSketch } from "@/components/sections/SheetSketch";
import { LinkButton } from "@/components/ui/LinkButton";
import { profile } from "@/lib/content/profile";

// The facts a screener checks first, in the order they check them.
const titleBlock = [
  { label: "Now", value: "Developer Trainee, Sahayogi One", detail: "Jun 2026 – present" },
  { label: "Before", value: "Full Stack Developer Intern, RBH Solutions", detail: "Jun – Jul 2025" },
  { label: "Studying", value: "B.Tech CSE, Bennett University", detail: `2023 – ${profile.graduation}` },
  { label: "Research", value: "Wheat-yield prediction from hyperspectral data", detail: "Manuscript under review" },
];

const nameLines = profile.name.toUpperCase().split(" ");
const introWords = profile.intro.split(" ");

export function Hero() {
  return (
    <section
      id="top"
      className="hero-section relative overflow-hidden border-b border-line"
    >
      <div className="sheet-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="sheet-grid-bright" aria-hidden="true" />
      <div className="hero-torch" aria-hidden="true" />
      <SheetSketch />

      <div className="relative mx-auto max-w-6xl px-5 pt-8 pb-14 sm:px-8 sm:pt-16 sm:pb-20">

        {/*
          Identity stage. Name top-left, open-to line bottom-left against the foot of the
          portrait, portrait down the right. Below lg the name and a smaller portrait share
          the first row, with the open-to line under both, so a phone reaches the intro
          without scrolling past a full-width photo.
        */}
        <div className="hero-stage relative mt-4 grid grid-cols-[minmax(0,1fr)_40%] items-end gap-x-4 gap-y-7 sm:mt-14 sm:gap-x-8 sm:gap-y-9 lg:items-stretch lg:gap-x-12 lg:grid-cols-[minmax(0,1fr)_minmax(260px,380px)] lg:grid-rows-[auto_1fr] lg:gap-y-8">
          <h1
            className="hero-name hero-rise col-start-1 row-start-1 self-center lg:self-auto"
            style={{ "--step": 2 } as CSSProperties}
          >
            {nameLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>

          <div
            className="hero-rise col-span-2 row-start-2 lg:col-span-1 lg:col-start-1 lg:self-end lg:pb-2"
            style={{ "--step": 4 } as CSSProperties}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
              Open to
            </p>
            <p className="mt-3.5 max-w-[30ch] font-display text-2xl tracking-tight text-accent sm:text-[1.75rem]">
              {profile.openTo}
            </p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Graduating {profile.graduation} · {profile.location}
            </p>
          </div>

          <div
            className="hero-rise col-start-2 row-start-1 flex justify-end lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:justify-end"
            style={{ "--step": 3 } as CSSProperties}
          >
            <HeroPortrait />
          </div>
        </div>

        <div className="relative z-10 mt-10 sm:mt-16">
          {/* The name above is the page h1, so the intro is a paragraph. */}
          <p className="max-w-[26ch] font-display text-[2rem] leading-[1.05] tracking-tight text-ink sm:text-[2.6rem] lg:text-[3rem]">
            {introWords.map((word, i) => (
              // The space must sit outside the inline-block, or it collapses.
              <Fragment key={`${word}-${i}`}>
                <span className="hero-word" style={{ "--i": i } as CSSProperties}>
                  {word}
                </span>
                {i < introWords.length - 1 ? " " : null}
              </Fragment>
            ))}
          </p>

          <p
            className="hero-rise mt-6 max-w-[54ch] text-base leading-relaxed text-ink-dim sm:text-lg"
            style={{ "--step": 5 } as CSSProperties}
          >
            {profile.summary}
          </p>

          <div
            className="hero-rise mt-8 flex flex-wrap items-center gap-3"
            style={{ "--step": 6 } as CSSProperties}
          >
            <a
              href="#experience"
              className="inline-flex min-h-11 items-center bg-accent px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ground hover:bg-ink"
            >
              Experience
            </a>
            <a
              href="#research"
              className="inline-flex min-h-11 items-center border border-line-bright px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-dim hover:border-accent hover:text-accent"
            >
              Research
            </a>
            <LinkButton href={`mailto:${profile.email}`} context="email Mehul">
              Email
            </LinkButton>
            <LinkButton href={profile.linkedin} context="Mehul Gupta on LinkedIn">
              LinkedIn
            </LinkButton>
          </div>
        </div>

        {/* Title block: the stamp in the corner of an engineering drawing. */}
        <dl
          className="hero-rise relative z-10 mt-14 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4"
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
