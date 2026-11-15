import type { CSSProperties } from "react";
import { Reveal } from "@/components/animation/Reveal";
import { Walkthrough } from "@/components/sections/Walkthrough";
import { CountUp } from "@/components/ui/CountUp";
import { FlowDiagram } from "@/components/ui/FlowDiagram";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { clientWork } from "@/lib/content/client-work";

/*
  A live client project, written up for engineers: the brief and the counts, the product
  played role by role with the server trace beside each screen, then the architecture and
  the decisions behind it, each pointing at the file that implements it.
*/
export function ClientWork() {
  return (
    <section id="client-work" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <SectionHeader label="Client Work" title={clientWork.client} caption={clientWork.summary} />

      {/* The brief: live status, who it's for, what I own, and four counts from the codebase. */}
      <Reveal as="article" className="mt-8 border border-line bg-surface">
        <header className="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-2 border border-accent/45 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
                <span aria-hidden="true" className="live-dot relative h-1.5 w-1.5 rounded-full bg-accent" />
                {clientWork.status}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">{clientWork.kind}</span>
            </div>
            <p className="mt-3 max-w-[72ch] text-[15px] leading-relaxed text-ink">{clientWork.ownership}</p>
          </div>
          <div className="shrink-0">
            <LinkButton href={clientWork.href} tone="accent" context={`${clientWork.client}, live site`}>
              Visit live site
            </LinkButton>
          </div>
        </header>

        <dl className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
          {clientWork.facts.map((fact) => (
            <div key={fact.label} className="flex flex-col-reverse bg-surface px-5 py-4 sm:px-6">
              <dt className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">{fact.label}</dt>
              <dd className="font-display text-3xl tracking-tight text-ink">
                <CountUp value={fact.value} />
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>

      {/* The product, role by role, with the server trace beside each screen. */}
      <div className="mt-14">
        <Reveal className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h3 className="font-display text-2xl tracking-tight text-ink">Walkthrough: one write, every role</h3>
          <p className="max-w-[56ch] font-mono text-[11px] leading-relaxed text-ink-faint">{clientWork.walkthroughNote}</p>
        </Reveal>
        <Walkthrough />
      </div>

      {/* How it is built. */}
      <div className="mt-16">
        <Reveal as="header" className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h3 className="font-display text-2xl tracking-tight text-ink">How it’s built</h3>
          <p className="font-mono text-[11px] text-ink-faint">Each decision names the file that implements it.</p>
        </Reveal>

        <Reveal className="mt-5 border border-line bg-surface px-5 py-5 sm:px-6">
          <FlowDiagram nodes={[...clientWork.architecture]} label="How a request travels" />
        </Reveal>

        <ul className="mt-5 grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {clientWork.decisions.map((decision, index) => (
            <Reveal
              as="li"
              key={decision.title}
              delay={(index % 3) * 80}
              className="decision flex flex-col bg-surface px-5 py-5 sm:px-6"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h4 className="mt-2 font-display text-lg leading-snug tracking-tight text-ink">{decision.title}</h4>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-dim">{decision.body}</p>
              <p className="mt-auto pt-4 font-mono text-[10.5px] text-ink-faint">{decision.ref}</p>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-5 grid grid-cols-1 gap-px border border-line bg-line lg:grid-cols-[1fr_1fr]">
          <div className="bg-surface px-5 py-5 sm:px-6">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">Deploys</h4>
            <ul className="mt-3 flex flex-col gap-2.5">
              {clientWork.ops.map((line, index) => (
                <li key={line} className="eng-line flex gap-3" style={{ "--i": index } as CSSProperties}>
                  <span aria-hidden="true" className="mt-[9px] h-1 w-1 shrink-0 bg-accent" />
                  <p className="text-[14px] leading-relaxed text-ink-dim">{line}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col bg-surface px-5 py-5 sm:px-6">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">Stack</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {clientWork.stack.map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
            </div>
            <div className="mt-auto pt-6">
              <LinkButton href={clientWork.href} context={`${clientWork.client}, live site`}>
                Live site
              </LinkButton>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
