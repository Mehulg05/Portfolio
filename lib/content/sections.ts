/*
  The one list of page sections, in page order. The header nav reads it, so adding a
  section here is what puts it in the nav.
*/
export const sections = [
  { id: "top", label: "Top" },
  { id: "experience", label: "Experience" },
  { id: "research", label: "Research" },
  { id: "system-map", label: "Skills" },
  { id: "revision-history", label: "Timeline" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
] as const;
