import { SiteHeader } from "@/components/navigation/SiteHeader";
import { Appendix } from "@/components/sections/Appendix";
import { CaseFiles } from "@/components/sections/CaseFiles";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { RevisionHistory } from "@/components/sections/RevisionHistory";
import { Roadmap } from "@/components/sections/Roadmap";
import { SystemMap } from "@/components/sections/SystemMap";
import { profile } from "@/lib/content/profile";

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <RevisionHistory />
        <SystemMap />
        <Experience />
        <CaseFiles />
        <Roadmap />
        <Appendix />
        <Contact />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 font-mono text-[11px] text-ink-faint sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© 2026 {profile.name}</span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Designed and built from scratch — Next.js, TypeScript, Tailwind</span>
            {/*
              CC BY obliges us to credit the author and link the source. It is not
              optional, so it lives here rather than being dropped with the caption.
            */}
            <span className="text-ink-faint/70">
              ·{" "}
              <a
                href="https://rive.app/marketplace/3977-8283-contact-cat/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent"
              >
                Contact Cat by hello174, CC BY
              </a>
            </span>
          </span>
        </div>
      </footer>
    </>
  );
}
