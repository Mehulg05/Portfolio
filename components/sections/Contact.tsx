import { Reveal } from "@/components/animation/Reveal";
import { ContactCatFrame } from "@/components/sections/ContactCatFrame";
import { CopyButton } from "@/components/ui/CopyButton";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { profile } from "@/lib/content/profile";

export function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <SectionHeader index="07" label="Open a thread" title="Have a role worth doing?" />

      {/*
        Two panels separated by a hairline, the same gap-px/bg-line construction the
        Appendix and the hero's title block use — so this reads as part of the sheet
        rather than a card style invented for one section.
      */}
      <div className="mt-10 grid grid-cols-1 gap-px border border-line bg-line lg:grid-cols-[1.3fr_1fr]">
        <div className="bg-ground p-5 sm:p-7">
          <Reveal as="p" className="max-w-[46ch] text-lg leading-relaxed text-ink-dim">
            I&apos;m a final-year CSE student, open to software, backend, full-stack, ML
            and product engineering roles. If you&apos;re hiring for one of those — or
            something adjacent — start a thread.
          </Reveal>

          <Reveal className="mt-8">
            <ContactCatFrame />
          </Reveal>
        </div>

        <div className="bg-ground p-5 sm:p-7">
          <Reveal>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
              Reach me directly
            </h3>

            {/* The address is the one link value that IS the content, so it stays readable. */}
            <p className="mt-5 font-display text-xl tracking-tight break-all text-ink sm:text-2xl">
              {profile.email}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <LinkButton href={`mailto:${profile.email}`} tone="accent">
                Email me
              </LinkButton>
              <CopyButton value={profile.email} context="email address" />
            </div>
          </Reveal>

          <Reveal className="mt-8 border-t border-line pt-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              Elsewhere
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <LinkButton href={profile.github} context="Mehul Gupta on GitHub">
                GitHub
              </LinkButton>
              <LinkButton href={profile.linkedin} context="Mehul Gupta on LinkedIn">
                LinkedIn
              </LinkButton>
              <LinkButton href={profile.resume} newTab context="one page PDF">
                Résumé (PDF)
              </LinkButton>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
