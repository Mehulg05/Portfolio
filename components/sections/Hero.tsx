import { Fragment, type CSSProperties } from "react";
import { HeroPortrait } from "@/components/sections/HeroPortrait";
import { profile, targetRoles } from "@/lib/content/profile";

const titleBlock = [
  { label: "Now", value: "Developer Trainee, Sahayogi One" },
  { label: "Studying", value: "B.Tech CSE, Bennett University" },
  { label: "Research", value: "Hyperspectral ML for crop yield" },
  { label: "Base", value: "Karnal / Greater Noida, IN" },
];

const nameLines = profile.name.toUpperCase().split(" ");
const headlineWords = profile.headline.split(" ");

export function Hero() {
  return (
    <section
      id="top"
      className="hero-section relative overflow-hidden border-b border-line"
    >
      <div className="sheet-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="hero-glow" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-5 pt-14 pb-16 sm:px-8 sm:pt-16 sm:pb-20">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p
            className="hero-rise flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint"
            style={{ "--step": 0 } as CSSProperties}
          >
            <span className="h-1.5 w-1.5 bg-accent" aria-hidden="true" />
            {profile.name} — build log
          </p>
          <p
            className="hover-hint hero-rise font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint"
            style={{ "--step": 1 } as CSSProperties}
          >
            Move the cursor across the portrait to develop it
          </p>
        </div>

        {/*
          Identity stage. Name top-left, roles bottom-left against the foot of the
          portrait, portrait down the right. Source order is the mobile order.
        */}
        <div className="hero-stage relative mt-10 grid gap-x-12 gap-y-9 sm:mt-14 lg:grid-cols-[minmax(0,1fr)_minmax(260px,380px)] lg:grid-rows-[auto_1fr] lg:gap-y-8">
          <h1
            className="hero-name hero-rise lg:col-start-1 lg:row-start-1"
            style={{ "--step": 2 } as CSSProperties}
          >
            {nameLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>

          <div
            className="hero-rise flex justify-center lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:justify-end"
            style={{ "--step": 3 } as CSSProperties}
          >
            <HeroPortrait />
          </div>

          <div
            className="hero-rise lg:col-start-1 lg:row-start-2 lg:self-end lg:pb-2"
            style={{ "--step": 4 } as CSSProperties}
          >
            <p
              id="roles-label"
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint"
            >
              Open to
            </p>
            {/*
              --role-count drives the stagger, so adding or removing a role in
              profile.ts retimes the cycle without touching the CSS.
            */}
            <ul
              aria-labelledby="roles-label"
              className="hero-roles mt-3.5 font-display text-2xl tracking-tight text-accent sm:text-[1.75rem]"
              style={
                {
                  "--role-cycle": "12.5s",
                  "--role-count": targetRoles.length,
                } as CSSProperties
              }
            >
              {targetRoles.map((role, i) => (
                <li key={role} className="role-slot" style={{ "--i": i } as CSSProperties}>
                  {role}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative z-10 mt-14 sm:mt-16">
          {/* The name above is the page h1, so the positioning line is a paragraph. */}
          <p className="max-w-[19ch] font-display text-[2.4rem] leading-[0.98] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]">
            {headlineWords.map((word, i) => (
              // The space must sit outside the inline-block, or it collapses.
              <Fragment key={`${word}-${i}`}>
                <span className="hero-word" style={{ "--i": i } as CSSProperties}>
                  {word}
                </span>
                {i < headlineWords.length - 1 ? " " : null}
              </Fragment>
            ))}
          </p>

          <p
            className="hero-rise mt-6 max-w-[54ch] text-base leading-relaxed text-ink-dim sm:text-lg"
            style={{ "--step": 5 } as CSSProperties}
          >
            {profile.supporting}
          </p>

          <div
            className="hero-rise mt-8 flex flex-wrap items-center gap-3"
            style={{ "--step": 6 } as CSSProperties}
          >
            <a
              href="#experience"
              className="bg-accent px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ground hover:bg-ink"
            >
              See what I&apos;ve shipped
            </a>
            <a
              href="#revision-history"
              className="border border-line-bright px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-dim hover:border-accent hover:text-accent"
            >
              Read how I think
            </a>
          </div>
        </div>

        {/* Title block — the stamp in the corner of an engineering drawing. */}
        <dl
          className="hero-rise relative z-10 mt-14 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4"
          style={{ "--step": 7 } as CSSProperties}
        >
          {titleBlock.map((item) => (
            <div key={item.label} className="bg-ground px-4 py-3.5">
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                {item.label}
              </dt>
              <dd className="mt-1.5 text-sm text-ink">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
