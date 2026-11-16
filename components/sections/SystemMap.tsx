import { SystemMapExplorer } from "@/components/sections/SystemMapExplorer";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function SystemMap() {
  return (
    <section id="system-map" aria-label="Skills" className="sheet-section">
      <SectionHeader
        label="Skills"
        title="Where I used each skill"
        caption="Each skill is labelled by how far I have taken it. Shipped means it runs in production, at Sahayogi One or at Alpha Academy."
      />

      <SystemMapExplorer />
    </section>
  );
}
