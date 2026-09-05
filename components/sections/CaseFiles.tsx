import Image from "next/image";
import { Reveal } from "@/components/animation/Reveal";
import { FlowDiagram } from "@/components/ui/FlowDiagram";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { caseFiles } from "@/lib/content/projects";

export function CaseFiles() {
  return (
    <section id="case-files" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <SectionHeader
        index="06"
        label="Case files"
        title="Three problems, and what I decided"
        caption="Screenshots show what a thing looks like. These show what it cost to decide — the constraint, the call I made, and what I gave up to make it."
      />

      <div className="mt-14 flex flex-col gap-5">
        {caseFiles.map((file, i) => (
          <Reveal as="article" key={file.id}>
            {/*
              Native <details>: the whole disclosure works with zero JavaScript,
              keeps correct assistive-technology semantics, and leaves the content
              in the DOM for crawlers. The first file opens by default so the
              section never reads as empty.
            */}
            <details className="case-file border border-line bg-surface" open={i === 0}>
              <summary className="case-summary px-5 py-5 sm:px-7">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
                    CF-{String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-2xl tracking-tight text-ink">
                    {file.name}
                  </h3>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                    {file.kind} · {file.period}
                  </span>
                  <span
                    className={`border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em] ${
                      file.kind === "Research"
                        ? "border-redline/45 text-redline"
                        : "border-line-bright text-ink-dim"
                    }`}
                  >
                    {file.status}
                  </span>
                </div>

                <div className="mt-3 flex items-start justify-between gap-6">
                  <p className="max-w-[68ch] text-[15px] leading-relaxed text-ink-dim">
                    {file.summary}
                  </p>
                  <span
                    aria-hidden="true"
                    className="case-toggle mt-0.5 shrink-0 font-mono text-lg leading-none text-ink-faint"
                  >
                    +
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {file.stack.map((item) => (
                    <Tag key={item}>{item}</Tag>
                  ))}
                </div>
              </summary>

              <div className="grid gap-px border-t border-line bg-line lg:grid-cols-[1.35fr_1fr]">
                <div className="bg-surface px-5 py-6 sm:px-7">
                  <h4 className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    Problem
                  </h4>
                  <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-ink-dim">
                    {file.problem}
                  </p>

                  <h4 className="mt-8 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                    Approach
                  </h4>
                  <ol className="mt-3 flex flex-col">
                    {file.approach.map((step, stepIndex) => (
                      <li
                        key={step}
                        className="flex gap-4 border-b border-line py-3 last:border-b-0"
                      >
                        <span className="font-mono text-[11px] text-ink-faint">
                          {String(stepIndex + 1).padStart(2, "0")}
                        </span>
                        <span className="max-w-[58ch] text-[15px] leading-relaxed text-ink-dim">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>

                  {file.screenshot ? (
                    <Image
                      src={file.screenshot.src}
                      alt={file.screenshot.alt}
                      width={1200}
                      height={750}
                      className="mt-8 h-auto w-full border border-line"
                    />
                  ) : null}

                  <div className="mt-8">
                    <FlowDiagram nodes={file.architecture} label="How it fits together" />
                  </div>
                </div>

                <div className="flex flex-col gap-6 bg-surface px-5 py-6 sm:px-7">
                  <div>
                    <h4 className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      Role
                    </h4>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink-dim">
                      {file.role}
                    </p>
                  </div>

                  <div className="border-l-2 border-redline bg-ground px-4 py-3.5">
                    <h4 className="font-mono text-[10px] uppercase tracking-[0.16em] text-redline">
                      The trade-off
                    </h4>
                    <p className="mt-2 text-[14px] leading-relaxed text-ink-dim">
                      {file.tradeoff}
                    </p>
                  </div>

                  {file.outcome ? (
                    <div>
                      <h4 className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                        Outcome
                      </h4>
                      <p className="mt-2 text-[15px] leading-relaxed text-ink-dim">
                        {file.outcome}
                      </p>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-3">
                    {file.repo ? (
                      <LinkButton href={file.repo.href} context={file.name}>
                        Read the code
                      </LinkButton>
                    ) : null}
                    {file.paper ? (
                      <LinkButton href={file.paper.href} context={file.name}>
                        Paper (PDF)
                      </LinkButton>
                    ) : null}
                    {!file.repo && file.repoNote ? (
                      <p className="font-mono text-[11px] tracking-[0.04em] text-ink-faint">
                        {file.repoNote}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
