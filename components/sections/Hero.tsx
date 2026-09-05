import { Fragment, type CSSProperties } from "react";
import { HeroPortrait } from "@/components/sections/HeroPortrait";
import { profile } from "@/lib/content/profile";

const titleBlock = [
  { label: "Now", value: "Developer Trainee, Sahayogi One" },
  { label: "Studying", value: "B.Tech CSE, Bennett University" },
  { label: "Research", value: "Hyperspectral ML for crop yield" },
  { label: "Base", value: "Karnal / Greater Noida, IN" },
];

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

        {/* Identity stage: the name is the backdrop, the portrait stands centred in front. */}
        <div className="hero-stage relative mt-10 sm:mt-12">
          {/*
            Split so the gap between the words is controllable. Both words are five
            letters, so the gap centres on the container — exactly where the portrait
            stands — and the head sits between them instead of over a letter.
          */}
          <span className="hero-name" aria-hidden="true">
            {profile.name
              .toUpperCase()
              .split(" ")
              .map((word) => (
                <span key={word}>{word}</span>
              ))}
          </span>

          <div
            className="hero-rise relative z-10 flex justify-center"
            style={{ "--step": 2 } as CSSProperties}
          >
            <HeroPortrait />
          </div>
        </div>

        <div className="relative z-10 mt-12 sm:mt-14">
          <h1 className="max-w-[19ch] font-display text-[2.4rem] leading-[0.98] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]">
            {headlineWords.map((word, i) => (
              // The space must sit outside the inline-block, or it collapses.
              <Fragment key={`${word}-${i}`}>
                <span className="hero-word" style={{ "--i": i } as CSSProperties}>
                  {word}
                </span>
                {i < headlineWords.length - 1 ? " " : null}
              </Fragment>
            ))}
          </h1>

          <p
            className="hero-rise mt-6 max-w-[54ch] text-base leading-relaxed text-ink-dim sm:text-lg"
            style={{ "--step": 4 } as CSSProperties}
          >
            {profile.supporting}
          </p>

          <div
            className="hero-rise mt-8 flex flex-wrap items-center gap-3"
            style={{ "--step": 5 } as CSSProperties}
          >
            <a
              href="#experience"
              className="bg-accent px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ground hover:bg-ink"
            >
              See what I&apos;ve shipped
            </a>
            <a
              href="#how-i-think"
              className="border border-line-bright px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-dim hover:border-accent hover:text-accent"
            >
              Read how I think
            </a>
          </div>
        </div>

        {/* Title block — the stamp in the corner of an engineering drawing. */}
        <dl
          className="hero-rise relative z-10 mt-14 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4"
          style={{ "--step": 6 } as CSSProperties}
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
