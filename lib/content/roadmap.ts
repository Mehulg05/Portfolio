/*
  The Now block: what is true this month, with a date. Update `asOf` every time anything
  here changes, and at least once a month. A stale Now block is worse than none.
*/

export const now = {
  asOf: "September 2026",
  items: [
    "Final year of B.Tech CSE at Bennett University.",
    "Integrating Meta's WhatsApp Business APIs at work.",
    "Wheat-yield research manuscript under review.",
    "Getting two or three of my own projects ready to deploy. They will go on this page with live links once they are up.",
  ],
  learning: [
    { name: "Generative models", note: "After the DeepLearning.AI GANs course, Apr 2026." },
    { name: "GPU programming", note: "After NVIDIA's CUDA C course, Apr 2025." },
    { name: "AWS", note: "Studying the basics. Nothing deployed on it yet." },
  ],
} as const;
