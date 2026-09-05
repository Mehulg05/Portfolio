import Image from "next/image";
import { Reveal } from "@/components/animation/Reveal";
import { CopyButton } from "@/components/ui/CopyButton";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { profile } from "@/lib/content/profile";

export function Contact() {
  return (
    <section id="contact" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <SectionHeader index="07" label="Open a thread" title="Have an idea worth building?" />

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_340px] lg:gap-16">
        <div>
          {/* [DRAFT] closing line — this is the last thing anyone reads. Make it yours. */}
          <Reveal as="p" className="max-w-[52ch] text-lg leading-relaxed text-ink-dim">
            I&apos;m most useful early — while the problem is still ambiguous and nothing
            has been decided yet. If that&apos;s where you are, start a thread.
          </Reveal>

          {/* The address is the one link value that IS the content, so it stays readable. */}
          <Reveal className="mt-12 border-t border-line pt-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
              Email
            </p>
            <p className="mt-3 font-display text-2xl tracking-tight break-all text-ink sm:text-3xl">
              {profile.email}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <LinkButton href={`mailto:${profile.email}`} tone="accent">
                Email me
              </LinkButton>
              <CopyButton value={profile.email} context="email address" />
            </div>
          </Reveal>

          <Reveal className="mt-10 border-t border-line pt-8">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint">
              Elsewhere
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <LinkButton href={profile.github} context={`Mehul Gupta on GitHub`}>
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

        {/* Plate — a mounted print on the drawing sheet, captioned like one. */}
        <Reveal as="div" className="lg:pt-2">
          <figure className="m-0">
            <div className="tick-frame border border-line bg-surface p-2.5 pt-3">
              <Image
                src="/mehul-portrait.png"
                alt="Mehul Gupta, standing in a black suit against a plain wall."
                width={1086}
                height={1448}
                quality={90}
                sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 90vw"
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-3 flex items-baseline justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              <span>Plate 01 — {profile.name}</span>
              <span className="text-accent">2026</span>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
