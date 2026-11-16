import Image from "next/image";
import { walkthrough } from "@/lib/content/client-work";
import { kindLabel, kindTone } from "./shared";

/* No JavaScript: every recording with native controls, every frame, every trace. */
export function StaticWalkthrough() {
  return (
    <div className="mt-8 flex flex-col gap-12">
      {walkthrough.map((flow) => (
        <section key={flow.id} aria-label={flow.label}>
          <h4 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">{flow.label}</h4>
          <p className="mt-2 max-w-[68ch] text-[14px] leading-relaxed text-ink-dim">{flow.summary}</p>
          {flow.kind === "video" ? (
            <video
              className="mt-4 block h-auto w-full border border-line"
              src={flow.video.src}
              poster={flow.video.poster}
              controls
              muted
              playsInline
              preload="none"
              aria-label={flow.video.description}
              width={flow.frame.width}
              height={flow.frame.height}
            />
          ) : null}
          <ol className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {flow.steps.map((step, index) => (
              <li key={`${flow.id}-${index}`} className="border border-line bg-surface">
                {"image" in step ? (
                  <Image
                    src={step.image}
                    alt={step.alt}
                    width={flow.frame.width}
                    height={flow.frame.height}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="block h-auto w-full border-b border-line"
                  />
                ) : null}
                <div className="px-4 py-4">
                  <p className="font-display text-base text-ink">
                    {"at" in step ? <span className="mr-2 font-mono text-[11px] text-ink-faint">{Math.floor(step.at)}s</span> : null}
                    {step.title}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">{step.detail}</p>
                  <ul className="mt-3 flex flex-col gap-1 font-mono text-[11px] text-ink-dim">
                    {step.log.map((line) => (
                      <li key={line.text}>
                        <span className={kindTone[line.kind]}>{kindLabel[line.kind]}</span> {line.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
