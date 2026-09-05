import { Reveal } from "@/components/animation/Reveal";
import { certifications, education } from "@/lib/content/profile";
import { achievements } from "@/lib/content/roadmap";

export function Appendix() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
        Appendix — the record
      </h2>

      <div className="mt-6 grid grid-cols-1 gap-px border border-line bg-line lg:grid-cols-3">
        <Reveal className="bg-ground p-5 sm:p-6">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
            Education
          </h3>
          <ul className="mt-5 flex flex-col gap-5">
            {education.map((item) => (
              <li key={item.qualification}>
                <p className="text-sm text-ink">{item.qualification}</p>
                <p className="mt-1 text-[13px] text-ink-dim">{item.institution}</p>
                <p className="mt-1.5 font-mono text-[11px] text-ink-faint">
                  {item.result} · {item.period}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="bg-ground p-5 sm:p-6">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
            Certifications
          </h3>
          <ul className="mt-5 flex flex-col gap-5">
            {certifications.map((item) => (
              <li key={item.name}>
                <p className="text-sm text-ink">{item.name}</p>
                <p className="mt-1.5 font-mono text-[11px] text-ink-faint">
                  {item.issuer} · {item.date}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="bg-ground p-5 sm:p-6">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
            Achievements
          </h3>
          <ul className="mt-5 flex flex-col gap-5">
            {achievements.map((item) => (
              <li key={item.title}>
                <p className="text-sm text-ink">{item.title}</p>
                <p className="mt-1.5 font-mono text-[11px] text-ink-faint">
                  {item.detail}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
