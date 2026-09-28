"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/animation/Reveal";
import {
  depthLabels,
  intelligence,
  pipeline,
  type Depth,
  type Skill,
} from "@/lib/content/skills";
import {
  bindSkillHover,
  lightSkill,
  scrollToSkillUse,
  skillKey,
  unlightAll,
} from "@/lib/skill-link";

const filters: Array<{ depth: Depth; hint: string; tone: string; dot: string }> = [
  { depth: "shipped", hint: "used in production at work", tone: "text-accent", dot: "bg-accent" },
  { depth: "academic", hint: "used in coursework or academic projects", tone: "text-ink", dot: "bg-ink-dim" },
  { depth: "research", hint: "used in the manuscript", tone: "text-redline", dot: "bg-redline" },
  { depth: "learning", hint: "studied, or in progress and not yet released", tone: "text-ink-dim", dot: "bg-line-bright" },
];

const dotFor = Object.fromEntries(filters.map((item) => [item.depth, item.dot])) as Record<Depth, string>;
const hintFor = Object.fromEntries(filters.map((item) => [item.depth, item.hint])) as Record<Depth, string>;

const allSkills = [...pipeline.flatMap((stage) => stage.skills), ...intelligence.skills];

/*
  Compact on purpose: one line per skill, so the whole map fits on one screen when the nav
  lands here. The note that used to sit under every skill now shows in the readout line
  when a chip is hovered or focused, and stays in the chip as screen-reader text.

  A click pins the chip: the readout holds, every tag on the page naming the skill
  lights up, and the page scrolls to the first of them. Clicking again releases it.
*/
function SkillChip({
  skill,
  dimmed,
  pinned,
  onShow,
  onPin,
}: {
  skill: Skill;
  dimmed: boolean;
  pinned: boolean;
  onShow: (skill: Skill | null) => void;
  onPin: (skill: Skill) => void;
}) {
  return (
    <li>
      <button
        type="button"
        data-skill={skillKey(skill.name)}
        aria-pressed={pinned}
        onMouseEnter={() => onShow(skill)}
        onMouseLeave={() => onShow(null)}
        onFocus={() => onShow(skill)}
        onBlur={() => onShow(null)}
        onClick={() => onPin(skill)}
        className={`skill-chip flex w-full items-center gap-2 border border-transparent px-1.5 py-2.5 text-left text-[13px] sm:py-px leading-5 text-ink transition-opacity duration-300 hover:border-line-bright focus-visible:border-accent ${
          dimmed ? "opacity-25" : ""
        } ${pinned ? "border-accent! bg-surface" : ""}`}
      >
        <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 ${dotFor[skill.depth]}`} />
        <span>{skill.name}</span>
        <span className="sr-only">
          , {depthLabels[skill.depth]}. {skill.note}
        </span>
      </button>
    </li>
  );
}

export function SystemMapExplorer() {
  const [filter, setFilter] = useState<Depth | null>(null);
  const [hovered, setHovered] = useState<Skill | null>(null);
  const [pinned, setPinned] = useState<Skill | null>(null);
  // Where the page was when a chip was pinned, so releasing it can come back.
  const returnY = useRef<number | null>(null);
  const pinnedKey = useRef<string | null>(null);
  useEffect(() => {
    pinnedKey.current = pinned ? skillKey(pinned.name) : null;
  }, [pinned]);

  const shown = hovered ?? pinned;
  const isDimmed = (skill: Skill) => filter !== null && skill.depth !== filter;
  const matching = filter ? allSkills.filter((s) => s.depth === filter).length : allSkills.length;

  // Hovering a tag anywhere on the page lights its chip here, and the other way round.
  useEffect(() => bindSkillHover((key) => key === pinnedKey.current), []);

  const pin = (skill: Skill) => {
    const key = skillKey(skill.name);
    unlightAll();
    if (pinned?.name === skill.name) {
      setPinned(null);
      if (returnY.current !== null) window.scrollTo({ top: returnY.current, behavior: "smooth" });
      returnY.current = null;
      return;
    }
    setPinned(skill);
    lightSkill(key);
    if (returnY.current === null) returnY.current = window.scrollY;
    scrollToSkillUse(key);
  };

  return (
    <>
      {/* The legend doubles as a filter, and sits above the map so it is read first. */}
      <Reveal className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((item) => {
            const isActive = filter === item.depth;
            return (
              <button
                key={item.depth}
                type="button"
                aria-pressed={isActive}
                title={item.hint}
                onClick={() => setFilter(isActive ? null : item.depth)}
                className={`flex min-h-11 items-center gap-2 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] sm:min-h-0 ${
                  isActive
                    ? "border-accent bg-surface text-ink"
                    : "border-line text-ink-faint hover:border-line-bright hover:text-ink-dim"
                }`}
              >
                <span aria-hidden="true" className={`h-1.5 w-1.5 ${item.dot}`} />
                <span className={item.tone}>{depthLabels[item.depth]}</span>
                <span className="sr-only">: {item.hint}</span>
              </button>
            );
          })}
        </div>

        <p className="font-mono text-[11px] text-ink-faint tabular-nums">
          {filter ? `${matching} of ${allSkills.length} shown` : `${allSkills.length} entries`}
        </p>
      </Reveal>

      {/* Readout above the map: a fixed-height line, so hovering never moves the page. */}
      <div
        aria-hidden="true"
        className="mt-3 flex min-h-[2.5rem] items-center gap-3 border border-accent/40 border-l-2 border-l-accent bg-accent-deep/25 px-4 py-2 text-[14px] leading-snug text-ink"
      >
        {shown ? (
          <>
            <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent">
              {shown.name}
            </span>
            <span className="text-ink-faint">·</span>
            <span className="text-ink">{shown.note}</span>
            {pinned && shown === pinned ? (
              <span className="ml-auto hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-faint sm:inline">
                Click again to release
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-ink-dim">
            Hover a skill to see where I used it. Click one to light it up across the page.
            {filter ? ` Showing ${depthLabels[filter].toLowerCase()}: ${hintFor[filter]}.` : ""}
          </span>
        )}
      </div>
      {/* Pipeline stages */}
      <div className="mt-3 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
        {pipeline.map((stage, i) => (
          <Reveal key={stage.id} delay={Math.min(i, 3) * 70} className="bg-ground px-4 py-2.5">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
              {i + 1 < 10 ? `0${i + 1}` : i + 1} · {stage.label}
            </h3>
            <p className="mt-0.5 text-[12px] leading-snug text-ink-faint">{stage.caption}</p>
            <ul className="mt-1.5 flex flex-col">
              {stage.skills.map((skill) => (
                <SkillChip
                  key={skill.name}
                  skill={skill}
                  dimmed={isDimmed(skill)}
                  pinned={pinned?.name === skill.name}
                  onShow={setHovered}
                  onPin={pin}
                />
              ))}
            </ul>
          </Reveal>
        ))}
      </div>

      {/* Intelligence branch */}
      <Reveal className="mt-px border border-line bg-surface px-4 py-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-redline">
            {intelligence.label}
          </h3>
          <p className="text-[12px] text-ink-faint">{intelligence.caption}</p>
        </div>
        <ul className="mt-1.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {intelligence.skills.map((skill) => (
            <SkillChip
                  key={skill.name}
                  skill={skill}
                  dimmed={isDimmed(skill)}
                  pinned={pinned?.name === skill.name}
                  onShow={setHovered}
                  onPin={pin}
                />
          ))}
        </ul>
      </Reveal>

    </>
  );
}
