// [DRAFT] Stances on each stage of the lifecycle. These should sound like you in an argument,
// not like a definition of the stage. Rewrite any that don't.

export type ProcessStage = {
  index: string;
  name: string;
  stance: string;
};

export const processStages: ProcessStage[] = [
  {
    index: "01",
    name: "Idea",
    stance: "Start from the friction someone is already working around by hand.",
  },
  {
    index: "02",
    name: "Requirements",
    stance: "Write down what would make this fail before writing what makes it work.",
  },
  {
    index: "03",
    name: "Architecture",
    stance: "Take the boring component unless the problem has earned the interesting one.",
  },
  {
    index: "04",
    name: "Development",
    stance: "Thin working slices. A running demo settles arguments a document can't.",
  },
  {
    index: "05",
    name: "Testing",
    stance: "Test the seams — auth, payments, and anything a stranger is allowed to touch.",
  },
  {
    index: "06",
    name: "Deployment",
    stance: "If it only runs on my machine, it isn't finished. It's a screenshot.",
  },
  {
    index: "07",
    name: "Monitoring",
    stance: "The system will tell you what users never bother to report.",
  },
  {
    index: "08",
    name: "Iteration",
    stance: "Ship, watch, correct. The first version is a hypothesis, not a deliverable.",
  },
];
