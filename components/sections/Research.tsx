import { Reveal } from "@/components/animation/Reveal";
import { FlowDiagram } from "@/components/ui/FlowDiagram";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { research } from "@/lib/content/research";

/*
  From lg up the section is at least a full screen tall and the card stretches to fill it,
  so landing here from the nav shows Research alone, not the start of Skills below.
*/
export function Research() {
  return (
    <section
      id="research"
      className="mx-auto flex max-w-6xl flex-col px-5 py-20 sm:px-8 sm:py-24 lg:min-h-[calc(100svh+2rem)] lg:pt-24 lg:pb-8"
    >
      <SectionHeader index="03" label="Research" title="Research" />

      <Reveal as="article" className="mt-6 flex flex-1 flex-col border border-line bg-surface">
        <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line px-5 py-3 sm:px-7">
          <span className="border border-redline/45 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-redline">
            {research.status}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            {research.period}
          </span>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-px bg-line lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col bg-surface px-5 py-5 sm:px-7">
            <h3 className="max-w-[44ch] font-display text-xl leading-tight tracking-tight text-ink sm:text-2xl">
              {research.title}
            </h3>
            <p className="mb-5 mt-3 text-[15px] leading-relaxed text-ink-dim">{research.topic}</p>

            <div className="mt-auto border-l-2 border-redline bg-ground px-4 py-2.5">
              <h4 className="font-mono text-[10px] uppercase tracking-[0.16em] text-redline">
                Status
              </h4>
              <p className="mt-1 text-[14px] leading-snug text-ink-dim">
                {research.statusNote}
              </p>
            </div>
          </div>

          <div className="flex flex-col bg-surface px-5 py-5 sm:px-7">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              Method
            </h4>
            <ul className="mt-3 flex flex-col gap-2.5">
              {research.methods.map((line) => (
                <li key={line} className="flex gap-3">
                  <span aria-hidden="true" className="mt-[9px] h-1 w-1 shrink-0 bg-redline" />
                  <p className="text-[15px] leading-relaxed text-ink-dim">{line}</p>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
              {research.stack.map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-line px-5 py-4 sm:px-7">
          <FlowDiagram nodes={[...research.pipeline]} label="How the pipeline fits together" />
          <p className="mt-3 font-mono text-[11px] text-ink-faint">{research.access}</p>
        </div>
      </Reveal>
    </section>
  );
}
