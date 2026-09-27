import { RevisionTrack } from "@/components/sections/RevisionTrack";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function RevisionHistory() {
  return (
    <section
      id="revision-history"
      className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28"
    >
      <SectionHeader
        index="05"
        label="Timeline"
        title="How I got here"
        caption="From school in Karnal to my first developer job."
      />

      <RevisionTrack />
    </section>
  );
}
