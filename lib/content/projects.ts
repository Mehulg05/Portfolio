// Case files. Problem/approach/stack are from the resume.
// `outcome` is intentionally optional and left unset: no invented metrics ship on this site.
// Fill it in only where you have a real number (users, rides matched, R²).

export type FlowNode = { label: string; note: string };

export type CaseFile = {
  id: string;
  name: string;
  period: string;
  status: string;
  kind: string;
  /** Shown while the case file is collapsed — the hook that earns the click. */
  summary: string;
  problem: string;
  approach: string[];
  architecture: FlowNode[];
  role: string;
  stack: string[];
  tradeoff: string;
  outcome?: string;
  /** Drop a PNG in /public and add it here — it renders above the architecture flow. */
  screenshot?: { src: string; alt: string };
  /** Public repository, when one exists. */
  repo?: { href: string };
  /** Shown instead of a repo button, so a missing repo reads as a decision, not an oversight. */
  repoNote?: string;
  /** A published or preprint PDF, when one exists. */
  paper?: { href: string };
};

export const caseFiles: CaseFile[] = [
  {
    id: "ocasio",
    name: "Ocasio",
    period: "Feb 2025",
    status: "Built",
    kind: "Marketplace platform",
    summary:
      "Verified vendors, recommendations and payments for an industry that runs on forwarded contacts.",
    problem:
      "Event planning runs on forwarded contacts and word of mouth. Organizers, photographers and planners are hard to verify, quality is unknowable in advance, and money changes hands on nothing but trust.",
    approach: [
      "Verified listings, so the directory is an assertion rather than a phone book.",
      "AI-powered recommendations to match a planner to an event they haven't run before.",
      "Secure payments, so the transaction isn't the weakest link in the chain.",
    ],
    architecture: [
      { label: "Organizer", note: "lists a service" },
      { label: "Verification", note: "identity + credentials" },
      { label: "Catalogue", note: "verified listings only" },
      { label: "Recommendations", note: "planner ↔ event fit" },
      { label: "Payments", note: "secure settlement" },
    ],
    role: "Concept, product definition and implementation.",
    stack: ["Web platform", "Recommendations", "Payments"],
    tradeoff:
      "The scarce effort went to verification and payment integrity, not the booking interface — a beautiful booking flow on top of unverifiable vendors still solves the wrong half of the problem.",
    repoNote: "Private repo",
  },
  {
    id: "uniryde",
    name: "UniRyde",
    period: "Mar 2026",
    status: "Built",
    kind: "Ride-sharing platform",
    summary:
      "Student-verified ride sharing, where trust is the entry condition rather than a profile badge.",
    problem:
      "Students travelling identical routes each pay for a whole cab. General ride-share apps can't prove the person you're matched with belongs to your university — which is exactly the assurance that makes sharing acceptable.",
    approach: [
      "Student verification as the entry condition, not an optional profile badge.",
      "Secure authentication protecting who is inside the matching pool.",
      "Trusted matching and route logic over the Google Maps API.",
    ],
    architecture: [
      { label: "Student", note: "university sign-up" },
      { label: "Verification", note: "the entry gate" },
      { label: "Auth", note: "session + identity" },
      { label: "Matching", note: "route overlap + trust" },
      { label: "Maps API", note: "route, pickup, ETA" },
      { label: "Shared ride", note: "cost split" },
    ],
    role: "Full-stack build — front end, data model and integrations.",
    stack: ["React.js", "HTML", "CSS", "MongoDB", "Google Maps API"],
    tradeoff:
      "Constraining the pool to verified students shrinks liquidity — fewer possible matches — for a pool where every match is defensible. On a safety product, that trade is worth making.",
    repoNote: "Private repo",
  },
  {
    id: "hyperspectral",
    name: "Hyperspectral Imaging for Precision Agriculture",
    period: "Apr 2026",
    status: "Paper",
    kind: "Research",
    summary:
      "Wheat yield prediction from hyperspectral data, judged on whether it survives a change of environment.",
    problem:
      "Wheat yield decisions get made late and with thin information. Hyperspectral data is enormously wide, heavily correlated, and models trained in one environment tend to collapse in another — which makes single-split accuracy a misleading result.",
    approach: [
      "RFECV-based spectral feature selection to cut a very wide feature space to what carries signal.",
      "A model bench spanning SVR, XGBoost, ElasticNet and a 1D-CNN rather than one favoured architecture.",
      "A stacked ensemble over those models, evaluated for cross-environment generalization.",
    ],
    architecture: [
      { label: "Spectral capture", note: "wide, correlated bands" },
      { label: "RFECV", note: "cut to what carries signal" },
      { label: "Model bench", note: "SVR · XGBoost · ElasticNet · 1D-CNN" },
      { label: "Stacked ensemble", note: "combines the bench" },
      { label: "Cross-environment eval", note: "the number that counts" },
      { label: "Yield prediction", note: "decision support" },
    ],
    role: "Framework design, modelling and evaluation.",
    stack: ["Python", "XGBoost", "SVR", "ElasticNet", "1D-CNN", "RFECV"],
    tradeoff:
      "Cross-environment evaluation reports a worse headline number than a single-environment split would. It's also the only number that means anything to a farmer standing in a different field.",
    repoNote: "Private repo",
  },
];
