import { SystemMapExplorer } from "@/components/sections/SystemMapExplorer";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function SystemMap() {
  return (
    <section id="system-map" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
      <SectionHeader
        index="04"
        label="Skills"
        title="Skills, and where I used them"
        caption="Each skill is labelled by how far I have taken it. Shipped means used in production at work."
      />

      <SystemMapExplorer />
    </section>
  );
}
