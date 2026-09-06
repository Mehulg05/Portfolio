// The vision statement is the single most important paragraph on the site.
// Drawn from the actual thread running through Ocasio, UniRyde and the research.

export const vision = {
  statement:
    "I want to build systems that make good decisions with incomplete information.",
  body: [
    "It's the thread through everything I've built. A recommendation for an event you have never planned. A match with a stranger you have to trust for the length of a shared ride. A yield prediction for a field that hasn't been harvested yet.",
    "The interesting problems were never in the model or the interface. They're in what a system does when it isn't sure — how it handles the case it wasn't trained on, and whether it fails in a way a person can recover from.",
    "That's what I'm building toward: infrastructure that's honest about its own uncertainty, in places where being wrong actually costs someone something.",
  ],
};

export type Exploration = {
  name: string;
  note: string;
};

export const exploring: Exploration[] = [
  { name: "Agentic automation", note: "Clawdbot — automating my own workflow before anyone else's." },
  { name: "Generative models", note: "GANs, and what they're actually good for outside demos." },
  { name: "GPU compute", note: "CUDA C — the cost of a computation, not just its correctness." },
  { name: "Cloud infrastructure", note: "AWS — because deployment is where student projects go to die." },
  { name: "Precision agriculture", note: "Taking the hyperspectral work out of the notebook and into a field." },
  { name: "End-to-end delivery", note: "Product to customer to handover, on real client work." },
];

export const achievements = [
  {
    title: "INSPIRE Awards, Government of India",
    detail: "₹10,000 innovation grant",
  },
  {
    title: "Battle of Brains — 1st place",
    detail: "Intra-district, MAT & General Knowledge",
  },
];
