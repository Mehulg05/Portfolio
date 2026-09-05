import { RevisionTrack } from "@/components/sections/RevisionTrack";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { revisions } from "@/lib/content/milestones";

// Derived rather than typed out, so the caption cannot drift from the data below it.
const breaking = revisions.filter((revision) =>
  revision.changes.some((change) => change.kind === "breaking"),
).length;

export function RevisionHistory() {
  return (
    <section
      id="revision-history"
      className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28"
    >
      <SectionHeader
        index="02"
        label="Revision history"
        title="What broke, and what replaced it"
        caption={`The case files show the systems and the roles show the work. This is the part neither can show: ${revisions.length} revisions, ${breaking} of them breaking. A major bump means something I was building on turned out to be wrong.`}
      />

      <RevisionTrack />
    </section>
  );
}
