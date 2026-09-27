/*
  The manuscript, described at the level the resume already makes public: title, topic,
  methods and status. No results, no venue, no co-authors until the paper is accepted and
  the co-authors agree. "Under review" is the exact status; never "paper" or "published".
*/

export const research = {
  title:
    "Hyperspectral Imaging for Precision Agriculture: Enhancing Crop Decision Making and Yield Optimization",
  status: "Manuscript under review",
  period: "Apr 2026",
  topic: "Predicting wheat yield from hyperspectral remote sensing data.",
  methods: [
    "Spectral feature selection with RFECV.",
    "Models compared: SVR, XGBoost, ElasticNet and a 1D-CNN, plus a stacked ensemble.",
    "A cross-environment generalisation analysis.",
  ],
  stack: ["Python", "XGBoost", "SVR", "ElasticNet", "1D-CNN", "RFECV"],
  /*
    The method as a flow. Every step restates a line in `methods` above. Nothing here is
    a result.
  */
  pipeline: [
    { label: "Hyperspectral data", note: "wheat fields, many narrow bands" },
    { label: "RFECV", note: "keep the bands that carry signal" },
    { label: "Model bench", note: "SVR · XGBoost · ElasticNet · 1D-CNN" },
    { label: "Stacked ensemble", note: "combines the bench" },
    { label: "Cross-environment check", note: "does it hold in a new setting?" },
    { label: "Yield prediction", note: "the output" },
  ],
  statusNote:
    "Results, venue and co-authors stay off this page until the paper is accepted and the co-authors agree.",
  access: "Code and data are private. Happy to walk through the method on a call.",
} as const;
