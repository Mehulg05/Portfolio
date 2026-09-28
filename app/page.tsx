import { SiteHeader } from "@/components/navigation/SiteHeader";
import { Appendix } from "@/components/sections/Appendix";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { Research } from "@/components/sections/Research";
import { RevisionHistory } from "@/components/sections/RevisionHistory";
import { SystemMap } from "@/components/sections/SystemMap";
import { profile } from "@/lib/content/profile";
import { now } from "@/lib/content/roadmap";

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Ordered by how much each section proves. */}
        <Hero />
        <Experience />
        <Research />
        <SystemMap />
        <RevisionHistory />
        <Appendix />
        <Contact />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 font-mono text-[11px] text-ink-faint sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="text-left">
            © 2026 {profile.name} · Last updated {now.asOf}
          </div>
          <div className="text-left sm:text-right">
            Built with Next.js · TypeScript · Tailwind CSS
          </div>
        </div>
      </footer>
    </>
  );
}
