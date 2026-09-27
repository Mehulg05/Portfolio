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
    summary: "Core product engineering team at a Noida startup that builds business software for Indian SMEs.",
    highlights: [
      "Built a payroll and HR module end to end: attendance, leave policies, payroll processing, PF/ESI/TDS compliance, onboarding and full-and-final settlement. Live in production.",
      "Wrote the HLD and LLD (database schema and API contracts) before any code. The senior team signed them off, and the module shipped only after code review and QA covering functional, edge-case and regression testing.",
      "Now integrating Meta's WhatsApp Business APIs into the company's messaging product.",
    ],
    stack: ["Next.js", "NestJS", "PostgreSQL"],
    current: true,
  },
  {
    id: "rbh-solutions",
    company: "RBH Solutions Private Limited",
    title: "Full Stack Developer Intern",
    period: "Jun – Jul 2025",
    summary:
      "SCADA software, used to monitor industrial equipment remotely. My first professional codebase, where I worked on both the admin panel and the customer panel.",
    highlights: [
      "Built role-based screens so each user sees only what their role allows: a super admin view to manage the whole system, a tech team view for the internal technical team, and a customer view limited to a client's own sites and data.",
      "Built and updated screens across the admin panel, where the system is run and configured.",
      "Built several customer-panel screens, the part clients log in to and use.",
    ],
  },
];
