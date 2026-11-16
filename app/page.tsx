import { SiteFooter } from "@/components/navigation/SiteFooter";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { Appendix } from "@/components/sections/Appendix";
import { ClientWork } from "@/components/sections/ClientWork";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Hero } from "@/components/sections/Hero";
import { Research } from "@/components/sections/Research";
import { RevisionHistory } from "@/components/sections/RevisionHistory";
import { SystemMap } from "@/components/sections/SystemMap";

export default function Page() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Ordered by how much each section proves. */}
        <Hero />
        <Experience />
        <ClientWork />
        <Research />
        <SystemMap />
        <RevisionHistory />
        <Appendix />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
