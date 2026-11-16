/*
  Source for Sahayogi One: Mehul's Task Description Document (Bennett University,
  Developer Trainee, 22 Jun – 22 Dec 2026). Mehul's call (2026-09-28): keep it brief and
  do not name the company's products anywhere on the site. Describe the work only.
  Left out on purpose: product names and links, the reporting manager's name, the
  enrollment number, customer data and internal architecture.

  No metric from either product's dashboard UI appears here. Those figures are mock
  design filler and must never be cited as real.

  RBH Solutions: from Mehul (2026-09-28): SCADA software; admin and customer panels;
  role-based screens for super admin, tech team and customer views. Stack not yet given.

  The Sahayogi One stack tags (Next.js, NestJS, PostgreSQL, Docker) come from the resume's
  role line.
*/

export type Product = {
  name: string;
  href: string;
  /** One line: what the product is. */
  what: string;
  /** One line: what Mehul personally did. Keep it defensible. */
  ownership: string;
  /** Specifics under the ownership line. Only what the task document states. */
  details?: string[];
  /** When Mehul worked on it. */
  period?: string;
  stack: string[];
  status?: string;
};

export type Role = {
  id: string;
  company: string;
  title: string;
  period: string;
  summary: string;
  /** Short bullets for roles without product cards. */
  highlights?: string[];
  /** Tags under the highlights. */
  stack?: string[];
  current?: boolean;
  products?: Product[];
};

export const roles: Role[] = [
  {
    id: "sahayogi-one",
    company: "Sahayogi One",
    title: "Developer Trainee",
    period: "Jun 2026 – present",
    summary: "Core product team at a Noida startup that builds business software for Indian SMEs.",
    highlights: [
      "Designed the payroll and HR module before writing code: HLD, LLD, database schema and API contracts, approved by the senior team.",
      "Built it end to end: attendance, leave policies, payroll processing, PF/ESI/TDS compliance, onboarding and full-and-final settlement.",
      "Gave it role-based access at three levels.",
      "Shipped it through code review and QA covering functional, edge-case and regression tests. It runs in production.",
      "Now integrating Meta's WhatsApp Business APIs into the company's messaging product.",
    ],
    stack: ["Next.js", "NestJS", "PostgreSQL", "Docker"],
    current: true,
  },
  {
    id: "rbh-solutions",
    company: "RBH Solutions Private Limited",
    title: "Full Stack Developer Intern",
    period: "Jun – Jul 2025",
    summary:
      "Remote internship on SCADA software, which lets operators and clients monitor industrial equipment from anywhere.",
    highlights: [
      "Built role-based screens for three roles, each seeing only what it may: super admin over the whole system, the internal tech team, and customers limited to their own sites and data.",
      "Built and updated admin-panel screens, where the system is run and configured.",
      "Built several customer-panel screens, the part clients log in to and use.",
    ],
  },
];
