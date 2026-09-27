import { Reveal } from "@/components/animation/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { certifications, courseraVerify, education } from "@/lib/content/profile";

/*
  The last certification stretches across whatever its row has left, so the grid never
  shows an empty cell (it would read as a grey block through the gap-px lines).
*/
function lastSpan(count: number) {
  const sm = count % 2 === 1 ? "sm:col-span-2" : "";
  const lg = count % 3 === 1 ? "lg:col-span-3" : count % 3 === 2 ? "lg:col-span-2" : "lg:col-span-1";
  return `${sm} ${lg}`;
}

/*
  Two bands, each the full width: education as three cards in a row, certifications as a
  grid below. Side-by-side columns left education looking empty next to a crowded
  certifications list. Both bands together still fit one screen when the nav lands here.
  Achievements and academic projects were taken off the site on purpose; their data is
  still in profile.ts.
*/
export function Appendix() {
  return (
    <section id="education" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <SectionHeader index="06" label="Education" title="Education and certifications" />

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
        <ul className="mt-3 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {certifications.map((item, index) => (
            <li
              key={item.name}
              className={`flex flex-col bg-surface px-5 py-4 ${
                index === certifications.length - 1 ? lastSpan(certifications.length) : ""
              }`}
            >
              {/* The name carries the link: a labelled anchor, never a bare URL. */}
              {item.credentialId ? (
                <a
                  href={`${courseraVerify}${item.credentialId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] leading-snug text-ink hover:text-accent"
                >
                  {item.name}
                  <span aria-hidden="true"> ↗</span>
                  <span className="sr-only">, verify credential</span>
                </a>
              ) : (
                <p className="text-[14px] leading-snug text-ink">{item.name}</p>
              )}
              <p className="mt-auto pt-2 font-mono text-[11px] text-ink-faint">
                {item.issuer} · {item.date}
              </p>
              {item.credentialId ? (
                <p className="mt-0.5 font-mono text-[11px] break-all text-ink-faint">
                  ID {item.credentialId}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
