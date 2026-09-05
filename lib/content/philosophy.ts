// [DRAFT] Four stances, each derived from something real in your record.
// The `evidence` line is the rule from the blueprint: no claim without proof within one scroll.

export type Stance = {
  id: string;
  statement: string;
  evidence: string;
};

export const stances: Stance[] = [
  {
    id: "trust",
    statement: "Trust is a feature you build, not a badge you display.",
    evidence:
      "On both Ocasio and UniRyde the hard part was never the interface. It was verification, authentication, and giving two strangers a reason to transact.",
  },
  {
    id: "generalization",
    statement: "One good score proves nothing. Generalization does.",
    evidence:
      "The hyperspectral yield work is judged on cross-environment performance with RFECV feature selection — not on the best number a single split can produce.",
  },
  {
    id: "layers",
    statement: "If I only understand the layer I work in, I'm guessing.",
    evidence:
      "CUDA C and operating systems, studied deliberately alongside full-stack work, because frameworks are a poor place to learn what a machine actually does.",
  },
  {
    id: "customer",
    statement: "The customer conversation is part of the engineering.",
    evidence:
      "At Sahayogi One a single week runs from product development to customer interaction to solution delivery. The requirements arrive in a conversation, not a ticket.",
  },
];
