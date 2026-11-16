import { Reveal } from "@/components/animation/Reveal";
import { FlowDiagram } from "@/components/ui/FlowDiagram";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { research } from "@/lib/content/research";

/*
  A flat card with the status as a plain tag in its header. It is its natural height on
  every viewport. The last pipeline node ("Yield prediction, the output") only restated the
  topic, so the diagram stops at the cross-environment check.
*/
export function Research() {
  return (
    <section id="research" aria-label="Research" className="sheet-section">
      <SectionHeader label="Research" title="One manuscript, under review" />

      <Reveal className="mt-8">
        <article className="border border-line bg-surface">
          <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line px-5 py-3 sm:px-7">
            <span className="border border-redline/60 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-redline">
              {research.status}
            </span>
            <span className="label-mono text-ink-faint">{research.period}</span>
          </header>

          <div className="grid grid-cols-1 gap-px bg-line lg:grid-cols-[1.1fr_1fr]">
            <div className="flex flex-col bg-surface px-5 py-5 sm:px-7">
              <h3 className="max-w-[44ch] font-display text-xl leading-tight tracking-tight text-ink sm:text-2xl">
                {research.title}
              </h3>
              <p className="measure mt-3 mb-5 text-body text-ink-dim">{research.topic}</p>

              <div className="mt-auto border-l-2 border-redline bg-ground px-4 py-2.5">
                <h4 className="label-mono text-redline">Status</h4>
                <p className="mt-1 text-note text-ink-dim">{research.statusNote}</p>
              </div>
            </div>

            <div className="flex flex-col bg-surface px-5 py-5 sm:px-7">
              <h4 className="label-mono text-ink-faint">Method</h4>
              <ul className="mt-3 flex flex-col gap-2.5">
                {research.methods.map((line) => (
                  <li key={line} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 bg-redline" />
                    <p className="measure text-body text-ink-dim">{line}</p>
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
            <FlowDiagram nodes={research.pipeline.slice(0, -1)} label="How the pipeline fits together" />
            <p className="mt-3 text-note text-ink-faint">{research.access}</p>
          </div>
        </article>
      </Reveal>
    </section>
  );
}
