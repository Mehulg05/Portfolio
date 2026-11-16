import Image from "next/image";
import type { ImageFlow } from "@/lib/content/client-work";

/* Still frames: every frame stacked, the active one shown, a CSS cursor gliding to its target. */
export function ImageStage({ flow, stepIndex, stepKey }: { flow: ImageFlow; stepIndex: number; stepKey: string }) {
  const step = flow.steps[stepIndex] ?? flow.steps[0];
  if (!step) return null;
  const point = { left: `${step.cursor.x}%`, top: `${step.cursor.y}%` };
  return (
    <div className="walk-stage relative overflow-hidden bg-[#f5f4f0]" style={{ aspectRatio: `${flow.frame.width} / ${flow.frame.height}` }}>
      {flow.steps.map((item, index) => {
        const active = index === stepIndex;
        return (
          <div key={`${flow.id}-${index}`} className="walk-shot absolute inset-0" data-active={active ? "" : undefined} aria-hidden={active ? undefined : true}>
            <Image
              src={item.image}
              alt={active ? item.alt : ""}
              fill
              quality={90}
              sizes="(min-width: 1152px) 780px, (min-width: 1024px) 66vw, 100vw"
              className="object-cover object-top"
            />
          </div>
        );
      })}
      <span aria-hidden="true" className="walk-cursor absolute z-10" style={point}>
        <svg viewBox="0 0 20 22" className="h-5 w-5 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]">
          <path d="M2 1.5v16.2l4.3-4.1 2.9 6.6 2.7-1.2-2.8-6.5h6.1z" fill="#fff" stroke="#11151c" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </span>
      {step.click ? <span key={`${stepKey}-click`} aria-hidden="true" className="walk-click absolute z-10" style={point} /> : null}
    </div>
  );
}
