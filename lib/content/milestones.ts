/*
  A changelog, taken literally.

  Case Files own the projects. Experience owns the roles. Neither can show the thing
  that is only visible ACROSS entries: what I got wrong, and what replaced it. So this
  section records diffs, not events. The project is the setting, never the subject.

  The version numbers are derived, not decorative. The rule is printed on the page:

    MAJOR — a belief broke. Something I was building on turned out to be wrong.
    MINOR — a capability was added, with nothing underneath it breaking.

  Every line below is a restatement of something already documented elsewhere in this
  repo (projects.ts, experience.ts, profile.ts). Nothing here is a new claim.
*/

export type ChangeKind = "breaking" | "added" | "removed";

export type Change = {
  kind: ChangeKind;
  text: string;
};

export type Revision = {
  version: string;
  /** Derived from the changes: any `breaking` entry forces a major bump. */
  bump: "major" | "minor" | "initial";
  period: string;
  /** The change itself — not the job, not the project. */
  title: string;
  /** Where it happened. Deliberately subordinate: one line, no detail. */
  context: string;
  changes: Change[];
  current?: boolean;
};

export const bumpRule: { label: string; meaning: string }[] = [
  { label: "MAJOR", meaning: "a belief broke" },
  { label: "MINOR", meaning: "a capability was added" },
];

export const changeLabels: Record<ChangeKind, string> = {
  breaking: "Breaking",
  added: "Added",
  removed: "Removed",
};

export const revisions: Revision[] = [
  {
    version: "v0.1",
    bump: "initial",
    period: "2023",
    title: "Initial commit",
    context: "B.Tech CSE, Bennett University.",
    changes: [
      { kind: "added", text: "C++, data structures and algorithms — the cost model before the frameworks." },
    ],
  },
  {
    version: "v1.0",
    bump: "major",
    period: "Feb 2025",
    title: "I had scoped the wrong problem",
    context: "Ocasio.",
    changes: [
      {
        kind: "breaking",
        text: "I had scoped it as a scheduling problem. It was a trust problem — verification and payment integrity, not the booking flow.",
      },
      { kind: "added", text: "First end-to-end build: listings, recommendations, payments." },
    ],
  },
  {
    version: "v2.0",
    bump: "major",
    period: "Apr 2025",
    title: "The framework is not the floor",
    context: "CUDA C with NVIDIA; operating systems with Google.",
    changes: [
      {
        kind: "breaking",
        text: "I could describe what my code did and not what the machine did. Those are different claims, and I had been making the wrong one.",
      },
      { kind: "added", text: "Parallelism at the metal, and the layer scheduling it." },
    ],
  },
  {
    version: "v3.0",
    bump: "major",
    period: "Jun — Jul 2025",
    title: "Working and keepable are different properties",
    context: "RBH Solutions — first professional codebase.",
    changes: [
      {
        kind: "breaking",
        text: "My definition of done was 'it runs'. In a codebase a team inherits, that is roughly the halfway mark.",
      },
      { kind: "removed", text: "Writing code whose only reader was me." },
    ],
  },
  {
    version: "v3.1",
    bump: "minor",
    period: "Mar 2026",
    title: "The same lesson, applied on purpose",
    context: "UniRyde.",
    changes: [
      {
        kind: "added",
        text: "Verification designed in as the entry condition, rather than discovered halfway like it was on Ocasio. Nothing broke here — that is the whole point of the entry.",
      },
    ],
  },
  {
    version: "v4.0",
    bump: "major",
    period: "Apr 2026",
    title: "A single split was never a result",
    context: "Hyperspectral yield research.",
    changes: [
      {
        kind: "breaking",
        text: "I had been reading a single split as a result. Across environments those numbers do not survive, which makes the headline figure the least interesting one.",
      },
      { kind: "added", text: "RFECV, a model bench rather than a favourite, and cross-environment evaluation." },
    ],
  },
  {
    version: "v5.0",
    bump: "major",
    period: "Jun 2026 — present",
    title: "The spec is an output, not an input",
    context: "Sahayogi One.",
    current: true,
    changes: [
      {
        kind: "breaking",
        text: "I had treated the spec as the input to engineering. It is an output of talking to whoever has the problem — and it moves.",
      },
      {
        kind: "added",
        text: "Shipping where a platform's rules and a data-protection law are hard constraints, not preferences.",
      },
    ],
  },
];
