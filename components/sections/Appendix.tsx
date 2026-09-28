import { Reveal } from "@/components/animation/Reveal";
import { PinBoard } from "@/components/sections/PinBoard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { sectionIndex } from "@/lib/content/sections";
import { education } from "@/lib/content/profile";

/*
  Two bands, each the full width: education as three cards in a row, certifications
  pinned to a board below (PinBoard). Side-by-side columns left education looking empty
  next to a crowded certifications list. Both bands together still fit one screen when
  the nav lands here. Achievements and academic projects were taken off the site on
  purpose; their data is still in profile.ts.
*/
export function Appendix() {
  return (
    <section id="education" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <SectionHeader index={sectionIndex("education")} label="Education" title="Education and certifications" />

      <Reveal className="mt-6">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
          Education
        </h3>
        <ul className="mt-3 grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-3">
          {education.map((item, index) => (
            <li key={item.qualification} className="flex flex-col bg-surface px-5 py-4">
              <span className="font-mono text-[11px] text-ink-faint">{item.period}</span>
              <p className="mt-2 text-[15px] leading-snug text-ink">{item.qualification}</p>
              <p className="mt-1 text-[13px] text-ink-dim">{item.institution}</p>
              <p
                className={`mt-auto pt-3 font-display text-2xl tracking-tight ${
                  index === 0 ? "text-accent" : "text-ink"
                }`}
              >
                {item.result}
              </p>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="mt-6">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
          Certifications
        </h3>
        <div className="mt-3">
          <PinBoard />
        </div>
      </Reveal>
    </section>
  );
}
