/*
  The Now block: what is true this month, with a date. Update `asOf` every time anything
  here changes, and at least once a month. A stale Now block is worse than none.
  `asOf` is printed in the footer as "Last updated …".
*/

export const now = {
  asOf: "November 2026",
  items: [
    "Final year of B.Tech CSE at Bennett University, graduating 2027.",
    "Integrating Meta's WhatsApp Business APIs into the messaging product at work.",
    "Wheat-yield manuscript under review since April 2026.",
    "Alpha Academy, a client's website and portal, is live. How it is built is in the Client Work section.",
  ],
  learning: [
    { name: "Generative models", note: "Since the DeepLearning.AI GANs course, Apr 2026." },
    { name: "GPU programming", note: "Since NVIDIA's CUDA C course, Apr 2025." },
    { name: "AWS", note: "Studying the basics. Nothing deployed on it yet." },
  ],
} as const;
