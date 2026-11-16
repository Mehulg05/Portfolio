import { SystemMapExplorer } from "@/components/sections/SystemMapExplorer";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function SystemMap() {
  return (
    <section id="system-map" className="sheet-section">
      <SectionHeader
        label="Skills"
        title="Skills, and where I used them"
        caption="Each skill is labelled by how far I have taken it. Shipped means used in production at work."
      />

      <SystemMapExplorer />
    </section>
  );
}
