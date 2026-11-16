import type { CSSProperties } from "react";
import type { ImageStep, VideoStep, WalkFlow } from "@/lib/content/client-work";
import { kindLabel, kindTone } from "./shared";

/*
  What the step means, and the trace of what the server did.

  Every step of the flow is rendered into the same grid cell and only the active one is
  visible, so the panel is always as tall as the flow's longest step: stepping never moves
  the page, and a short flow doesn't leave a void. Only the active layer carries the
  animation classes, so each step's heading and log replay as it becomes active.
*/
export function Trace({
  flow,
  stepIndex,
  announce,
  live,
}: {
  flow: WalkFlow;
  stepIndex: number;
  announce: boolean;
  /** The tour is running, so the "Server trace" dot may pulse. */
  live: boolean;
}) {
  const steps: ReadonlyArray<VideoStep | ImageStep> = flow.steps;
  const active = steps[stepIndex];
  return (
    <div className="flex flex-col border border-line bg-surface">
      {/*
        One persistent live region: the layers below swap visibility, which screen readers
        don't announce reliably. It stays polite and goes empty during autoplay, because
        flipping aria-live together with the text is dropped by some screen readers.
      */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announce && active ? `Step ${stepIndex + 1} of ${steps.length}: ${active.title}` : ""}
      </p>
      <div className="grid flex-1">
        {steps.map((step, index) => (
          <TraceStep
            key={`${flow.id}-${index}`}
            flowLabel={flow.label}
            step={step}
            index={index}
            total={steps.length}
            active={index === stepIndex}
            live={live}
          />
        ))}
      </div>
    </div>
  );
}

function TraceStep({
  flowLabel,
  step,
  index,
  total,
  active,
  live,
}: {
  flowLabel: string;
  step: VideoStep | ImageStep;
  index: number;
  total: number;
  active: boolean;
  live: boolean;
}) {
  const enter = active ? "walk-in" : "";
  return (
    <div
      className={`flex flex-col [grid-area:1/1] ${active ? "" : "invisible"}`}
      aria-hidden={active ? undefined : true}
    >
      <div className={`px-5 pt-5 ${enter}`}>
        <p className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          <span>{flowLabel}</span>
          <span className="tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </p>
        <h4 className="mt-2 font-display text-lg leading-snug tracking-tight text-ink">{step.title}</h4>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">{step.detail}</p>
      </div>

      <div className="mt-4 flex flex-1 flex-col border-t border-line bg-ground px-4 py-3.5">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full bg-accent ${active && live ? "walk-live" : ""}`} />
          Server trace
        </p>
        <ol className="mt-2.5 flex flex-col gap-1.5" aria-label="What the server does for this step">
          {step.log.map((line, lineIndex) => (
            <li
              key={line.text}
              className={`grid grid-cols-[3rem_minmax(0,1fr)] gap-2 font-mono text-[11px] leading-[1.5] ${active ? "walk-line" : ""} ${line.kind === "note" ? "italic" : ""}`}
              style={{ "--i": lineIndex } as CSSProperties}
            >
              <span className={`uppercase tracking-[0.08em] ${kindTone[line.kind]}`}>{kindLabel[line.kind]}</span>
              {/* Long identifiers such as requirePermission('attendance.mark') must wrap at 320px. */}
              <span className={`[overflow-wrap:anywhere] ${line.kind === "note" ? "text-ink-faint" : "text-ink"}`}>{line.text}</span>
            </li>
          ))}
        </ol>
        <div className={`mt-auto flex flex-wrap gap-1.5 pt-4 ${enter}`}>
          {step.tech.map((item) => (
            <span key={item} className="border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-dim">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
