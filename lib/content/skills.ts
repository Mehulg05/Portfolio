// Skills with where each one was used. `depth` must match the evidence:
// shipped  = used in production at work
// academic = used in a course or academic project that is not deployed
// research = used in the manuscript
// learning = studied, or in progress and not yet released

export type Depth = "shipped" | "academic" | "research" | "learning";

export type Skill = {
  name: string;
  depth: Depth;
  note: string;
};

export type Stage = {
  id: string;
  label: string;
  caption: string;
  skills: Skill[];
};

export const depthLabels: Record<Depth, string> = {
  shipped: "Shipped",
  academic: "Academic",
  research: "Research",
  learning: "Learning",
};

export const pipeline: Stage[] = [
  {
    id: "interface",
    label: "Frontend",
    caption: "What the user sees",
    skills: [
      { name: "Next.js", depth: "shipped", note: "Payroll module at Sahayogi One, in production. Also this site." },
      { name: "React.js", depth: "academic", note: "UniRyde's front end." },
      { name: "HTML / CSS", depth: "academic", note: "UniRyde." },
    ],
  },
  {
    id: "backend",
    label: "Backend",
    caption: "Where requests are handled",
    skills: [
      { name: "NestJS", depth: "shipped", note: "Payroll module APIs at Sahayogi One, in production." },
      { name: "Role-based access control", depth: "shipped", note: "Three access levels in the payroll module. Role-based screens at RBH." },
      { name: "Design docs (HLD, LLD)", depth: "shipped", note: "Written and approved before building the payroll module." },
      { name: "WhatsApp Business APIs", depth: "learning", note: "Integrating them at work since Sep 2026. Not released yet." },
      { name: "Auth and verification", depth: "academic", note: "Student verification and sign-in in UniRyde." },
      { name: "Google Maps API", depth: "academic", note: "Routes and matching in UniRyde." },
    ],
  },
  {
    id: "languages",
    label: "Languages",
    caption: "What I write it in",
    skills: [
      { name: "TypeScript", depth: "academic", note: "This site is written in it." },
      { name: "JavaScript", depth: "academic", note: "UniRyde." },
      { name: "Python", depth: "research", note: "The wheat-yield research." },
      { name: "C++", depth: "academic", note: "Data structures and algorithms coursework." },
      { name: "Java", depth: "learning", note: "Coursework." },
    ],
  },
  {
    id: "data",
    label: "Data",
    caption: "Where it is stored",
    skills: [
      { name: "PostgreSQL", depth: "shipped", note: "The payroll module's schema, in production." },
      { name: "MongoDB", depth: "academic", note: "UniRyde's database." },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    caption: "What it runs on",
    skills: [
      { name: "Docker", depth: "shipped", note: "Used at Sahayogi One." },
      { name: "Linux / shell", depth: "academic", note: "Command-line basics for day-to-day development." },
      { name: "AWS", depth: "learning", note: "Studying the basics." },
      { name: "Operating systems", depth: "learning", note: "Google course, Feb 2025." },
      { name: "CUDA C", depth: "learning", note: "NVIDIA course, Apr 2025." },
    ],
  },
];

export const intelligence: Stage = {
  id: "intelligence",
  label: "Machine learning",
  caption: "Models from the wheat-yield manuscript (under review), and what I am learning now",
  skills: [
    { name: "XGBoost", depth: "research", note: "One of the models compared." },
    { name: "SVR", depth: "research", note: "One of the models compared." },
    { name: "ElasticNet", depth: "research", note: "One of the models compared." },
    { name: "1D-CNN", depth: "research", note: "A neural model over the spectral bands." },
    { name: "Stacked ensembles", depth: "research", note: "Combining the models above." },
    { name: "RFECV", depth: "research", note: "Feature selection across the spectral bands." },
    { name: "LLM APIs", depth: "learning", note: "Building with LLM APIs on my own." },
    { name: "RAG", depth: "learning", note: "Retrieval-augmented generation: embeddings, retrieval, grounded answers." },
    { name: "GANs", depth: "learning", note: "DeepLearning.AI course, Apr 2026." },
    { name: "TensorFlow", depth: "learning", note: "DeepLearning.AI course, Feb 2025." },
  ],
};
