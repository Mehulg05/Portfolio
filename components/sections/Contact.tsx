import { Reveal } from "@/components/animation/Reveal";
import { ContactEmailNote, needsScriptReason } from "@/components/sections/ContactEmailNote";
import { ContactForm } from "@/components/sections/ContactForm";
import { CopyButton } from "@/components/ui/CopyButton";
import { LinkButton } from "@/components/ui/LinkButton";
import { isContactConfigured } from "@/lib/contact/config";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { profile } from "@/lib/content/profile";

export function Contact() {
  /*
    Decided when the page renders. It is prerendered on the host, where env vars exist at
    build time, so this reflects the deployment; the API answers 503 `unconfigured` as the
    backstop if that ever drifts. Unconfigured, the form is not rendered at all.
  */
  const configured = isContactConfigured();
  // [CONFIRM] "after I graduate in 2027" and the absent reply time: see docs/reviews/open-questions-r2.md.
  const intro = (
    <Reveal as="p" className="max-w-[56ch] text-lg leading-relaxed text-ink-dim">
      I am looking for {profile.openTo.toLowerCase()} after I graduate in {profile.graduation}. If you
      are hiring, or want to ask how something on this page was built, write to me.
    </Reveal>
  );

  return (
    <section id="contact" className="sheet-section">
      <SectionHeader label="Contact" title="Email me, or write here" />

      {/*
        Two panels separated by a hairline, the same gap-px/bg-line construction the
        Appendix and the hero's title block use — so this reads as part of the sheet
        rather than a card style invented for one section.
      */}
      <div
        className={`mt-10 grid grid-cols-1 gap-px border border-line bg-line ${configured ? "lg:grid-cols-[1.3fr_1fr]" : ""}`}
      >
        {configured ? (
          <div className="bg-ground p-5 sm:p-7">
            {intro}
            <Reveal className="mt-8 border-t border-line pt-6">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
                Send a message
              </h3>
              <div className="mt-5">
                <ContactForm email={profile.email} />
                {/*
                  Sending needs JavaScript, so without it the form is hidden and the
                  address takes its place. Inside <noscript> the style only applies
                  when scripts are off; React leaves the block alone on hydration.
                */}
                <noscript>
                  <style>{".contact-form{display:none}"}</style>
                  <ContactEmailNote email={profile.email} reason={needsScriptReason} />
                </noscript>
              </div>
            </Reveal>
          </div>
        ) : null}

        <div className="bg-ground p-5 sm:p-7">
          {/* Without a form, email is the whole contact route and takes the width. */}
          {configured ? null : <div className="mb-8">{intro}</div>}
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
                Resume (PDF)
              </LinkButton>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
