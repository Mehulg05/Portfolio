import { projects } from "@/lib/content/projects";

/*
  The one list of page sections, in page order. The header nav and every section
  header take their number from here, so the two can never disagree. Projects only
  counts once a live project exists; the section renders nothing before then.
*/
export const sections = [
  { id: "top", label: "Top" },
  { id: "experience", label: "Experience" },
  { id: "research", label: "Research" },
  ...(projects.length > 0 ? [{ id: "projects", label: "Projects" }] : []),
  { id: "system-map", label: "Skills" },
  { id: "revision-history", label: "Timeline" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
] as const;

export type SectionId = (typeof sections)[number]["id"];

/** Two-digit position of a section, "01" for the top. */
export function sectionIndex(id: SectionId) {
  const position = sections.findIndex((section) => section.id === id) + 1;
  return String(position).padStart(2, "0");
}
