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
          <span>Designed and built from scratch — Next.js, TypeScript, Tailwind</span>
        </div>
      </footer>
    </>
  );
}
