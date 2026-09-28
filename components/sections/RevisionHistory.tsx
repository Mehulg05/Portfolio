import { RevisionTrack } from "@/components/sections/RevisionTrack";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { sectionIndex } from "@/lib/content/sections";

export function RevisionHistory() {
  return (
    <section
      id="revision-history"
      className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28"
    >
      <SectionHeader
        index={sectionIndex("revision-history")}
        label="Timeline"
        title="How I got here"
        caption="From school in Karnal to my first developer job."
      />

      <RevisionTrack />
    </section>
  );
}
