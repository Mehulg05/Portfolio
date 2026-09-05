import { SystemMapExplorer } from "@/components/sections/SystemMapExplorer";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function SystemMap() {
  return (
    <section id="system-map" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <SectionHeader
        index="03"
        label="System map"
        title="What I work with, in the order a request travels"
        caption="A list of logos tells you nothing about whether someone can hold a system in their head. This is the same set, arranged the way it actually connects — and labelled honestly by how far I've taken each piece."
      />

      <SystemMapExplorer />
    </section>
  );
}
