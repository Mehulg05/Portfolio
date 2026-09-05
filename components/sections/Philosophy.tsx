import { Reveal } from "@/components/animation/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { stances } from "@/lib/content/philosophy";

export function Philosophy() {
  return (
    <section id="how-i-think" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <SectionHeader
        index="02"
        label="How I think"
        title="Four things I'd defend in an argument"
        caption="Not values. Positions — each one arrived at from something I actually had to build or measure."
      />

      <ol className="mt-14 flex flex-col gap-14">
        {stances.map((stance, i) => (
          <Reveal as="li" key={stance.id} className="grid gap-5 lg:grid-cols-[7ch_1fr]">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint lg:pt-3">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="max-w-[24ch] font-display text-2xl leading-[1.15] tracking-tight text-ink sm:text-[2rem]">
                {stance.statement}
              </p>
              <p className="mt-5 max-w-[64ch] border-l border-line pl-5 text-[15px] leading-relaxed text-ink-dim">
                {stance.evidence}
              </p>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
