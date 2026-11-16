/*
  The manuscript, described at the level the resume already makes public: title, topic,
  methods and status. No results, no venue, no co-authors until the manuscript is accepted
  and the co-authors agree. "Under review" is the exact status; never "paper" or "published".
*/

export const research = {
  title:
    "Hyperspectral Imaging for Precision Agriculture: Enhancing Crop Decision Making and Yield Optimization",
  status: "Manuscript under review",
  period: "Apr 2026",
  topic: "Predicting wheat yield from hyperspectral remote sensing data.",
  methods: [
    "Selected the informative spectral bands with RFECV, recursive feature elimination with cross-validation.",
    "Compared four regressors: SVR, XGBoost, ElasticNet and a 1D-CNN.",
    "Combined the four in a stacked ensemble.",
    "Analysed cross-environment generalisation, whether the models hold up outside the environment they were trained in.",
  ],
  stack: ["Python", "XGBoost", "SVR", "ElasticNet", "1D-CNN", "RFECV"],
  /*
    The method as a flow. Every step restates a line in `methods` above. Nothing here is
    a result. Notes wrap past about 22 characters in the diagram's nodes.
  */
  pipeline: [
    { label: "Hyperspectral data", note: "wheat, many narrow bands" },
    { label: "RFECV", note: "keeps informative bands" },
    { label: "Model bench", note: "SVR · XGBoost · ElasticNet · 1D-CNN" },
    { label: "Stacked ensemble", note: "combines the four" },
    { label: "Cross-environment check", note: "trained here, tested there" },
    { label: "Yield prediction", note: "the output" },
  ],
  statusNote:
    "Results, venue and co-authors stay off this page until the manuscript is accepted and the co-authors agree.",
  access: "Code and data are private. I can walk through the method on a call.",
} as const;
