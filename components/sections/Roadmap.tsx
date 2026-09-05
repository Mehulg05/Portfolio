import { Reveal } from "@/components/animation/Reveal";
import { VisionScrub } from "@/components/sections/VisionScrub";
import { exploring } from "@/lib/content/roadmap";

export function Roadmap() {
  return (
    <section id="roadmap" className="relative overflow-hidden border-y border-line">
      <VisionScrub />

      <div className="relative mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
        <Reveal
          as="p"
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint"
        >
          Currently exploring
        </Reveal>
        <ul className="mt-5 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {exploring.map((item, i) => (
            <Reveal
              as="li"
              key={item.name}
              delay={Math.min(i % 3, 2) * 70}
              className="bg-ground px-5 py-4"
            >
              <p className="text-sm text-ink">{item.name}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-faint">{item.note}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
