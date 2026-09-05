// Skills as a system, not a word cloud. `depth` is the honesty layer:
// shipped = used in something real, research = used in the paper, learning = studied, not yet shipped.

export type Depth = "shipped" | "research" | "learning";

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
  research: "Research",
  learning: "Learning",
};

export const pipeline: Stage[] = [
  {
    id: "interface",
    label: "Interface",
    caption: "What the user actually touches",
    skills: [
      { name: "React.js", depth: "shipped", note: "UniRyde's front end — routing, state, map views." },
      { name: "JavaScript", depth: "shipped", note: "The glue across both platform projects." },
      { name: "HTML / CSS", depth: "shipped", note: "Hand-written layouts before reaching for a kit." },
    ],
  },
  {
    id: "integration",
    label: "Integration",
    caption: "Where my system meets someone else's",
    skills: [
      { name: "Google Maps API", depth: "shipped", note: "Routing and pickup matching in UniRyde." },
      { name: "REST APIs", depth: "shipped", note: "The contract between client and service." },
      { name: "Auth flows", depth: "shipped", note: "Student verification and secure sign-in." },
    ],
  },
  {
    id: "logic",
    label: "Logic",
    caption: "Where the decisions get made",
    skills: [
      { name: "Python", depth: "shipped", note: "Research pipeline and automation work." },
      { name: "C++", depth: "learning", note: "The language I learned data structures in." },
      { name: "Java", depth: "learning", note: "Coursework and OOP fundamentals." },
      { name: "DSA", depth: "shipped", note: "Not a checkbox — how I reason about cost." },
    ],
  },
  {
    id: "data",
    label: "Data",
    caption: "What has to still be true tomorrow",
    skills: [
      { name: "MongoDB", depth: "shipped", note: "UniRyde's document store — users, rides, matches." },
      { name: "SQL", depth: "learning", note: "Relational modelling and querying." },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    caption: "What it runs on",
    skills: [
      { name: "AWS", depth: "learning", note: "Cloud fundamentals — deployment is where projects go to die." },
      { name: "Operating systems", depth: "learning", note: "Certified with Google, Feb 2025." },
      { name: "CUDA / GPU", depth: "learning", note: "NVIDIA CUDA C — parallelism at the metal." },
    ],
  },
];

export const intelligence: Stage = {
  id: "intelligence",
  label: "Intelligence",
  caption: "The branch that decides under uncertainty",
  skills: [
    { name: "XGBoost", depth: "research", note: "Gradient boosting for yield regression." },
    { name: "SVR", depth: "research", note: "Support vector regression baseline." },
    { name: "ElasticNet", depth: "research", note: "Regularised linear baseline on spectral features." },
    { name: "1D-CNN", depth: "research", note: "Deep model over the spectral axis." },
    { name: "Stacked ensembles", depth: "research", note: "Where the accuracy actually came from." },
    { name: "RFECV", depth: "research", note: "Feature selection across a very wide spectral space." },
    { name: "GANs", depth: "learning", note: "DeepLearning.AI, Apr 2026." },
    { name: "Agentic automation", depth: "learning", note: "Clawdbot — automating my own workflow first." },
  ],
};
