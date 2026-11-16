import type { CSSProperties } from "react";
import { Reveal } from "@/components/animation/Reveal";
import { Walkthrough } from "@/components/sections/Walkthrough";
import { CountUp } from "@/components/ui/CountUp";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { clientWork } from "@/lib/content/client-work";

/*
  A live client project, written up for engineers: the brief and the counts, the product
  played role by role with the server trace beside each screen, then the architecture and
  the decisions behind it, each pointing at the file that implements it.
*/

// Written out rather than derived: under `as const` only some facts carry a note, and a
// union of literals would not expose the optional field.
type Fact = { readonly value: number; readonly label: string; readonly note?: string };
type Decision = (typeof clientWork.decisions)[number];
type ArchitectureNode = (typeof clientWork.architecture)[number];

const decisionRows = [
  { field: "problem", label: "Problem", tone: "text-[13.5px] text-ink" },
  { field: "choice", label: "Choice", tone: "text-[13px] text-ink-dim" },
  { field: "consequence", label: "Result", tone: "text-[13px] text-ink-dim" },
] as const satisfies readonly { field: keyof Decision; label: string; tone: string }[];

export function ClientWork() {
  return (
    <section id="client-work" aria-label={`Client work: ${clientWork.client}`} className="sheet-section">
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
            <FactCell key={fact.label} fact={fact} />
          ))}
        </dl>
      </Reveal>

      {/* The product, role by role, with the server trace beside each screen. */}
      <div className="mt-16">
        <SubHeading title="Walkthrough: one write, every role" note={clientWork.walkthroughNote} />
        <Walkthrough />
      </div>

      {/* How it is built. */}
      <div className="mt-16">
        <SubHeading title="How it’s built" note="Each decision names the file that implements it." />

        <Reveal className="mt-6 border border-line bg-surface px-5 py-5 sm:px-6">
          <ArchitectureStrip nodes={clientWork.architecture} label="How a request travels" />
        </Reveal>

        <ul className="mt-5 grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
          {clientWork.decisions.map((decision, index) => (
            <DecisionCard key={decision.title} decision={decision} index={index} />
          ))}
        </ul>

        <Hindsight items={clientWork.hindsight} />

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
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* The two sub-sections share one heading so their size and spacing can't drift apart. */
function SubHeading({ title, note }: { title: string; note: string }) {
  return (
    <Reveal as="header" className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
      <h3 className="font-display text-2xl tracking-tight text-ink">{title}</h3>
      <p className="max-w-[56ch] font-mono text-[11px] leading-relaxed text-ink-faint">{note}</p>
    </Reveal>
  );
}

/*
  Number first, label tight under it, so "31 / Postgres tables" reads as one phrase; the
  note is a quieter third line. The dt stays first in the DOM for screen readers and is
  reordered visually. Grid rows stretch, so a two-line label never leaves cells uneven.
*/
function FactCell({ fact }: { fact: Fact }) {
  return (
    <div className="flex flex-col bg-surface px-4 py-4 sm:px-6 sm:py-5">
      <dt className="order-2 mt-2 text-[13px] leading-snug text-ink-dim">{fact.label}</dt>
      <dd className="order-1 font-display text-3xl leading-none tracking-tight text-ink">
        <CountUp value={fact.value} />
      </dd>
      {fact.note ? (
        <dd className="order-3 mt-1 font-mono text-[10.5px] leading-snug text-ink-faint">{fact.note}</dd>
      ) : null}
    </div>
  );
}

/*
  The request path as a schematic strip. Local rather than FlowDiagram because five nodes
  in a row only have room for their notes from lg up: below that the nodes stack, with the
  label and note side by side from sm so the stack stays short.
*/
function ArchitectureStrip({ nodes, label }: { nodes: readonly ArchitectureNode[]; label: string }) {
  return (
    <figure className="m-0">
      <figcaption className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">{label}</figcaption>
      <ol className="mt-3 flex flex-col lg:grid lg:grid-cols-5 lg:gap-6">
        {nodes.map((node, index) => (
          <li key={node.label} className="relative flex flex-col">
            <div className="flex-1 border border-line bg-ground px-3.5 py-3 sm:grid sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-baseline sm:gap-4 lg:block">
              <p className="text-[13px] leading-tight text-ink">{node.label}</p>
              <p className="mt-1 text-[11px] leading-snug text-ink-faint sm:mt-0 lg:mt-1">{node.note}</p>
            </div>
            {index < nodes.length - 1 ? (
              <>
                <span aria-hidden="true" className="connector-v mx-auto block h-4 w-px lg:hidden" />
                <span
                  aria-hidden="true"
                  className="absolute left-full top-1/2 hidden w-6 -translate-y-1/2 text-center font-mono text-[11px] text-accent lg:block"
                >
                  →
                </span>
              </>
            ) : null}
          </li>
        ))}
      </ol>
    </figure>
  );
}

/*
  A design-review card: what hurt, what I chose, what it bought, and where it lives.
  The ref is pinned to the bottom so the file paths line up across a row.
*/
function DecisionCard({ decision, index }: { decision: Decision; index: number }) {
  return (
    <Reveal as="li" delay={(index % 3) * 80} className="flex flex-col bg-surface px-5 py-5 sm:px-6">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h4 className="font-display text-lg leading-snug tracking-tight text-ink">{decision.title}</h4>
      </div>

      <dl className="mt-4 grid grid-cols-[3.75rem_minmax(0,1fr)] items-baseline gap-x-3 gap-y-2.5">
        {decisionRows.map((row) => (
          <DecisionRow key={row.field} label={row.label} tone={row.tone} text={decision[row.field]} />
        ))}
      </dl>

      <div className="mt-auto pt-5">
        <p className="flex items-start gap-2 border-t border-line pt-3 font-mono text-[10.5px] leading-relaxed text-ink-faint">
          <FileGlyph />
          <span className="min-w-0 [overflow-wrap:anywhere]">
            <span className="sr-only">Implemented in </span>
            {decision.ref}
          </span>
        </p>
      </div>
    </Reveal>
  );
}

function DecisionRow({ label, tone, text }: { label: string; tone: string; text: string }) {
  return (
    <>
      <dt className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-faint">{label}</dt>
      <dd className={`m-0 leading-relaxed ${tone}`}>{text}</dd>
    </>
  );
}

function FileGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 10 12"
      className="mt-[3px] h-3 w-2.5 shrink-0 fill-none stroke-current"
      strokeWidth="1"
      strokeLinejoin="round"
    >
      <path d="M1.5.5h4.75L8.5 2.75V11.5h-7z M6.25.5v2.25H8.5" />
    </svg>
  );
}

/* What I'd change with hindsight. Quiet on purpose, and absent when there is nothing to say. */
function Hindsight({ items }: { items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <Reveal className="mt-5 grid grid-cols-1 gap-x-8 gap-y-3 border border-line bg-surface px-5 py-5 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <h4 className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint lg:pt-[5px]">
        What I’d do differently
      </h4>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span aria-hidden="true" className="mt-[9px] h-1 w-1 shrink-0 bg-redline" />
            <p className="text-[14px] leading-relaxed text-ink-dim">{item}</p>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
