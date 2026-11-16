import { RevisionTrack } from "@/components/sections/RevisionTrack";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function RevisionHistory() {
  return (
    <section id="revision-history" className="sheet-section">
      <SectionHeader
        label="Timeline"
        title="How I got here"
        caption="From school in Karnal to my first developer job."
      />

      <RevisionTrack />
    </section>
  );
}
