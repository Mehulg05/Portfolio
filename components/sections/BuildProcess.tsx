import { BuildDiagram } from "@/components/sections/BuildDiagram";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function BuildProcess() {
  return (
    <section id="how-i-build" className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
      <SectionHeader
        index="07"
        label="How I build"
        title="Idea to iteration, and what I believe at each step"
        caption="Every stage below is one most engineers can name. The line under each one is the part that's mine — what I actually do there, stated plainly enough to disagree with."
      />

      <BuildDiagram />
    </section>
  );
}
