// Skills with where each one was used. `depth` must match the evidence:
// shipped  = used in a system running in production: Sahayogi One, or Alpha Academy
//            (client work, see lib/content/client-work.ts)
// academic = used in a course or academic project that is not deployed
// research = used in the manuscript
// learning = studied, or in progress and not yet released
//
// [DRAFT] Alpha Academy entries assume the ownership line in client-work.ts, still marked
// [DRAFT] there. If Mehul narrows it, narrow these notes and depths to match.
//
// Each note is a proof pointer: where the skill was used, then its state. Keep notes under
// about 90 characters; the explorer shows them on one line.

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
      { name: "Next.js", depth: "shipped", note: "Payroll module at Sahayogi One and Alpha Academy's site, both in production." },
      { name: "React.js", depth: "academic", note: "UniRyde's front end." },
      { name: "HTML / CSS", depth: "academic", note: "UniRyde's pages." },
    ],
  },
  {
    id: "backend",
    label: "Backend",
    caption: "Where requests are handled",
    skills: [
      { name: "NestJS", depth: "shipped", note: "Payroll module APIs at Sahayogi One, in production." },
      { name: "Fastify", depth: "shipped", note: "Alpha Academy's API, in production." },
      { name: "Role-based access control", depth: "shipped", note: "Three access levels in the payroll module, six roles at Alpha Academy, screens at RBH." },
      { name: "Auth and sessions", depth: "shipped", note: "argon2id, lockout and rotating refresh tokens at Alpha Academy. Sign-in in UniRyde." },
      { name: "Vitest / Playwright", depth: "shipped", note: "43 API integration test files at Alpha Academy, Playwright on its public site." },
      { name: "WhatsApp Business APIs", depth: "learning", note: "Integrating them at Sahayogi One since Sep 2026. Not released yet." },
      { name: "Google Maps API", depth: "academic", note: "Route-based matching in UniRyde." },
    ],
  },
  {
    id: "languages",
    label: "Languages",
    caption: "What I write it in",
    skills: [
      { name: "TypeScript", depth: "shipped", note: "Alpha Academy, site and API, in production. Also this site." },
      { name: "JavaScript", depth: "academic", note: "UniRyde." },
      { name: "Python", depth: "research", note: "The wheat-yield manuscript." },
      { name: "C++", depth: "academic", note: "Data structures and algorithms coursework." },
      { name: "Java", depth: "learning", note: "Familiar from coursework." },
    ],
  },
  {
    id: "data",
    label: "Data",
    caption: "Where it is stored",
    skills: [
      { name: "PostgreSQL", depth: "shipped", note: "Payroll module schema at Sahayogi One, and Alpha Academy on Neon. Both in production." },
      { name: "Drizzle ORM", depth: "shipped", note: "Alpha Academy's data layer, in production." },
      { name: "MongoDB", depth: "academic", note: "UniRyde's database." },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    caption: "What it runs on",
    skills: [
      { name: "Docker", depth: "shipped", note: "Part of the Sahayogi One stack." },
      { name: "Render", depth: "shipped", note: "Alpha Academy's hosting: static site, API service and a staging copy." },
      { name: "Linux / shell", depth: "academic", note: "Day-to-day development on the command line." },
      { name: "AWS", depth: "learning", note: "Studying the basics. Nothing deployed on it yet." },
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
    { name: "XGBoost", depth: "research", note: "Gradient-boosted trees, one of four regressors compared." },
    { name: "SVR", depth: "research", note: "Support vector regression, one of four regressors compared." },
    { name: "ElasticNet", depth: "research", note: "Regularised linear regression, one of four regressors compared." },
    { name: "1D-CNN", depth: "research", note: "A 1D convolutional network over the spectral bands." },
    { name: "Stacked ensembles", depth: "research", note: "Combines the four regressors into one predictor." },
    { name: "RFECV", depth: "research", note: "Selects the informative spectral bands before modelling." },
    { name: "LLM APIs", depth: "learning", note: "Studying on my own. Nothing shipped yet." },
    { name: "RAG", depth: "learning", note: "Studying retrieval-augmented generation on my own." },
    { name: "GANs", depth: "learning", note: "DeepLearning.AI course, Apr 2026." },
    { name: "TensorFlow", depth: "learning", note: "DeepLearning.AI course, Feb 2025." },
  ],
};
