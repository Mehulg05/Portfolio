"use client";

import { useState } from "react";
import { Reveal } from "@/components/animation/Reveal";
import { DepthBadge } from "@/components/ui/Tag";
import {
  depthLabels,
  intelligence,
  pipeline,
  type Depth,
  type Skill,
} from "@/lib/content/skills";

const filters: Array<{ depth: Depth; hint: string; tone: string }> = [
  { depth: "shipped", hint: "used in something real", tone: "text-accent" },
  { depth: "research", hint: "used in the paper", tone: "text-redline" },
  { depth: "learning", hint: "studied, not yet shipped", tone: "text-ink-dim" },
];

const allSkills = [...pipeline.flatMap((stage) => stage.skills), ...intelligence.skills];

function SkillRow({ skill, dimmed }: { skill: Skill; dimmed: boolean }) {
  return (
    <li className={dimmed ? "opacity-25 transition-opacity duration-300" : "transition-opacity duration-300"}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-ink">{skill.name}</span>
        <DepthBadge depth={skill.depth} />
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-faint">{skill.note}</p>
    </li>
  );
}

export function SystemMapExplorer() {
  const [filter, setFilter] = useState<Depth | null>(null);

  const isDimmed = (skill: Skill) => filter !== null && skill.depth !== filter;
  const matching = filter ? allSkills.filter((s) => s.depth === filter).length : allSkills.length;

  return (
    <>
      {/* Flow bar */}
      <Reveal className="mt-12 overflow-x-auto">
        <div className="flex min-w-max items-center gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">
          {pipeline.map((stage, i) => (
            <span key={stage.id} className="flex items-center gap-3">
              <span className={i === 0 ? "text-accent" : undefined}>{stage.label}</span>
              {i < pipeline.length - 1 ? (
                <span className="text-ink-faint" aria-hidden="true">
                  →
                </span>
              ) : null}
            </span>
          ))}
        </div>
      </Reveal>

      {/* Pipeline stages */}
      <div className="mt-5 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
        {pipeline.map((stage, i) => (
          <Reveal
            key={stage.id}
            delay={Math.min(i, 3) * 70}
            className="bg-ground p-5 hover:bg-surface"
          >
            <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
              {stage.label}
            </h3>
            <p className="mt-1.5 text-[12px] leading-relaxed text-ink-faint">
              {stage.caption}
            </p>
            <ul className="mt-5 flex flex-col gap-4">
              {stage.skills.map((skill) => (
                <SkillRow key={skill.name} skill={skill} dimmed={isDimmed(skill)} />
              ))}
            </ul>
          </Reveal>
        ))}
      </div>

      {/* Intelligence branch */}
      <Reveal className="mt-px flex flex-col items-center">
        <div className="connector-v h-8 w-px" aria-hidden="true" />
        <div className="w-full border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-redline">
              {intelligence.label} — branch
            </h3>
            <p className="text-[12px] text-ink-faint">{intelligence.caption}</p>
          </div>
          <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {intelligence.skills.map((skill) => (
              <SkillRow key={skill.name} skill={skill} dimmed={isDimmed(skill)} />
            ))}
          </ul>
        </div>
      </Reveal>

      {/* Legend doubles as a filter — "show me only what he's actually shipped". */}
      <Reveal className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((item) => {
            const isActive = filter === item.depth;
            return (
              <button
                key={item.depth}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(isActive ? null : item.depth)}
                className={`border px-3 py-1.5 font-mono text-[11px] tracking-[0.04em] ${
                  isActive
                    ? "border-accent bg-surface text-ink"
                    : "border-line text-ink-faint hover:border-line-bright hover:text-ink-dim"
                }`}
              >
                <span className={item.tone}>{depthLabels[item.depth]}</span>
                <span className="text-ink-faint"> — {item.hint}</span>
              </button>
            );
          })}
        </div>

        <p className="font-mono text-[11px] text-ink-faint tabular-nums">
          {filter ? `${matching} of ${allSkills.length} shown` : `${allSkills.length} entries`}
        </p>
      </Reveal>
    </>
  );
}
