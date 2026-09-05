/*
  CONFIDENTIALITY — READ BEFORE DEPLOY.

  This file describes products belonging to an employer (Sahayogi One), not personal
  work. Detail is deliberately kept to one line per product — no internal architecture,
  customer data, contract terms or roadmap belongs here.

  [NEEDS INPUT: confirmed you have permission to describe these publicly? — still unanswered]

  No metric from either product's dashboard UI appears here. Those figures are mock
  design filler and must never be cited as real.
*/

export type Product = {
  name: string;
  href: string;
  /** One line: what the product is. */
  what: string;
  /** One line: what Mehul personally worked on. Keep it narrow and defensible. */
  ownership: string;
  stack: string[];
  status?: string;
};

export type Role = {
  id: string;
  company: string;
  title: string;
  period: string;
  summary: string;
  current?: boolean;
  products?: Product[];
};

export const roles: Role[] = [
  {
    id: "sahayogi-one",
    company: "Sahayogi One",
    title: "Developer Trainee",
    period: "Jun 2026 — present",
    summary:
      "Working across business verticals — product development, customer interaction and solution delivery — on two products built for Indian SMEs.",
    current: true,
    products: [
      {
        name: "BoSS — Business Operations & Systems Suite",
        href: "https://boss.officesahayogi.in",
        what: "A business operating system for Indian SMEs, spanning 18 modules across the transactions a small business runs on.",
        ownership: "Built the People & Payroll and Travel & Expense modules.",
        stack: ["NestJS", "Next.js"],
        status: "Launched",
      },
      {
        name: "Chat with Sahayogi",
        href: "https://chatwithsahayogi.in",
        what: "A WhatsApp Business Platform product for Indian SMEs — bulk messaging inside Meta's rules and India's consent law.",
        ownership:
          "Worked across the product, with a focus on WhatsApp Business API onboarding.",
        stack: ["NestJS", "Next.js"],
      },
    ],
  },
  {
    id: "rbh-solutions",
    company: "RBH Solutions Private Limited",
    title: "Full Stack Developer Intern",
    period: "Jun — Jul 2025",
    summary:
      "First professional codebase. Enterprise software under industry-standard development practices, and the difference between code that works and code a team can keep.",
  },
];
