import { Reveal } from "@/components/animation/Reveal";
import { PinBoard } from "@/components/sections/PinBoard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { education } from "@/lib/content/profile";

/*
  Two bands, each the full width: education as three cards in a row, certifications as a
  flat list below (PinBoard). Results are plain body text: they are facts to check, not
  the point of the section. Achievements and academic projects were taken off the site on
  purpose; their data is still in profile.ts.
*/
export function Appendix() {
  return (
    <section id="education" aria-label="Education and certifications" className="sheet-section">
      <SectionHeader label="Education" title="Degree, school and certificates" />

      <Reveal className="mt-8">
        <h3 className="label-mono text-ink-faint">Education</h3>
        <ul className="mt-3 grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-3">
          {education.map((item) => (
            <li key={item.qualification} className="flex flex-col bg-surface px-5 py-4">
              <span className="label-mono text-ink-faint">{item.period}</span>
              <p className="mt-2 text-body text-ink">{item.qualification}</p>
              <p className="mt-1 text-note text-ink-dim">{item.institution}</p>
              <p className="mt-auto pt-3 text-note text-ink-dim">{item.result}</p>
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal className="mt-6">
        <h3 className="label-mono text-ink-faint">Certifications</h3>
        <div className="mt-3">
          <PinBoard />
        </div>
      </Reveal>
    </section>
  );
}
