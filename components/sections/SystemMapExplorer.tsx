"use client";

import { useState } from "react";
import { Reveal } from "@/components/animation/Reveal";
import {
  depthLabels,
  intelligence,
  pipeline,
  type Depth,
  type Skill,
} from "@/lib/content/skills";

const filters: Array<{ depth: Depth; hint: string; tone: string; dot: string }> = [
  { depth: "shipped", hint: "used in a system running in production", tone: "text-accent", dot: "bg-accent" },
  { depth: "academic", hint: "used in coursework or academic projects", tone: "text-ink", dot: "bg-ink-dim" },
  { depth: "research", hint: "used in the manuscript", tone: "text-redline", dot: "bg-redline" },
  { depth: "learning", hint: "studied, or in progress and not yet released", tone: "text-ink-dim", dot: "bg-line-bright" },
];

const dotFor = Object.fromEntries(filters.map((item) => [item.depth, item.dot])) as Record<Depth, string>;

const allSkills = [...pipeline.flatMap((stage) => stage.skills), ...intelligence.skills];

/*
  Plain list items, not buttons: a chip has nothing to activate, so it is no tab stop. Shipped
  and research entries print their evidence inline, since that is the proof. Academic and
  learning entries stay one line; their note is still there for screen readers. While a filter
  is on, non-matching entries are dimmed and hidden from assistive technology.
*/
function SkillChip({ skill, dimmed }: { skill: Skill; dimmed: boolean }) {
  const showsEvidence = skill.depth === "shipped" || skill.depth === "research";
  return (
    <li
      aria-hidden={dimmed || undefined}
      className={`px-1.5 py-1.5 text-[13px] leading-5 text-ink transition-opacity duration-300 ${dimmed ? "opacity-25" : ""}`}
    >
      <span className="flex items-center gap-2">
        <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 ${dotFor[skill.depth]}`} />
        <span>{skill.name}</span>
        <span className="sr-only">, {depthLabels[skill.depth]}.</span>
      </span>
      <span
        className={showsEvidence ? "mt-0.5 block pl-3.5 text-[12px] leading-snug text-ink-faint" : "sr-only"}
      >
        {skill.note}
      </span>
    </li>
  );
}

export function SystemMapExplorer() {
  const [filter, setFilter] = useState<Depth | null>(null);

  const isDimmed = (skill: Skill) => filter !== null && skill.depth !== filter;
  const matching = filter ? allSkills.filter((s) => s.depth === filter).length : allSkills.length;

  return (
    <>
      {/* The legend doubles as a filter, and sits above the map so it is read first. */}
      <Reveal className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          {filters.map((item) => {
            const isActive = filter === item.depth;
            return (
              <button
                key={item.depth}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(isActive ? null : item.depth)}
                className={`flex min-h-11 items-center gap-2 border px-3 py-1.5 label-mono sm:min-h-0 ${
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

        <p role="status" className="label-mono text-ink-faint tabular-nums">
          {filter ? `${matching} of ${allSkills.length} shown` : `${allSkills.length} entries`}
        </p>
      </Reveal>

      <p className="mt-3 text-[14px] leading-snug text-ink-dim">
        Shipped and research entries say where I used the skill.
        {filter ? ` Showing ${depthLabels[filter].toLowerCase()}: ${filters.find((f) => f.depth === filter)?.hint}.` : ""}
      </p>
      {/* Pipeline stages */}
      <div className="mt-3 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
        {pipeline.map((stage, i) => (
          <Reveal key={stage.id} delay={Math.min(i, 3) * 70} className="bg-ground px-4 py-2.5">
            <h3 className="label-mono text-accent">
              {i + 1 < 10 ? `0${i + 1}` : i + 1} · {stage.label}
            </h3>
            <p className="mt-0.5 text-[12px] leading-snug text-ink-faint">{stage.caption}</p>
            <ul className="mt-1.5 flex flex-col">
              {stage.skills.map((skill) => (
                <SkillChip key={skill.name} skill={skill} dimmed={isDimmed(skill)} />
              ))}
            </ul>
          </Reveal>
        ))}
      </div>

      {/* Intelligence branch */}
      <Reveal className="mt-px border border-line bg-surface px-4 py-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="label-mono text-redline">
            {intelligence.label}
          </h3>
          <p className="text-[12px] text-ink-faint">{intelligence.caption}</p>
        </div>
        <ul className="mt-1.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {intelligence.skills.map((skill) => (
            <SkillChip key={skill.name} skill={skill} dimmed={isDimmed(skill)} />
          ))}
        </ul>
      </Reveal>
    </>
  );
}
