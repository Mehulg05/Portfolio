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

/*
  The blueprint drawn under a role: the work as a schematic. A `flow` row is a chain of
  blocks joined by connectors (a process, or a module's parts in order); a `lanes` row is
  blocks side by side with no order between them (the views a role-based system
  exposes). Every block's `note` restates a highlight above it; nothing on the drawing
  is a claim the bullets do not already make.
*/
export type BlueprintBlock = {
  label: string;
  /** Shown in the readout when the block is hovered, focused or tapped. */
  note: string;
};

export type BlueprintRow = {
  label: string;
  mode: "flow" | "lanes";
  blocks: BlueprintBlock[];
  /** A bracket under the whole row, e.g. the access control that spans a module. */
  span?: string;
};

export type Role = {
  id: string;
  company: string;
  title: string;
  period: string;
  summary: string;
  /** Short bullets for roles without product cards. */
  highlights?: string[];
  /** Tags under the highlights. Names match lib/content/skills.ts so the two link. */
  stack?: string[];
  blueprint?: { label: string; rows: BlueprintRow[] };
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
    stack: [
      "NestJS",
      "Next.js",
      "PostgreSQL",
      "Docker",
      "Role-based access control",
      "Design docs (HLD, LLD)",
      "WhatsApp Business APIs",
    ],
    blueprint: {
      label: "The payroll module, as a drawing",
      rows: [
        {
          label: "How it shipped",
          mode: "flow",
          blocks: [
            { label: "HLD", note: "High-level design, written before any code." },
            { label: "LLD", note: "Database schema and API contracts." },
            { label: "Sign-off", note: "Both designs approved by the senior team before the build started." },
            { label: "Build", note: "The module, built end to end." },
            { label: "Code review", note: "Reviewed before it could ship." },
            { label: "QA", note: "Functional, edge-case and regression testing." },
            { label: "Production", note: "Live, and in use." },
          ],
        },
        {
          label: "What it contains",
          mode: "flow",
          span: "Role-based access, three levels, whole module",
          blocks: [
            { label: "Attendance", note: "Where a pay period starts: who worked, and when." },
            { label: "Leave", note: "Leave policies, applied against attendance." },
            { label: "Payroll run", note: "Payroll processing for the period." },
            { label: "PF, ESI and TDS", note: "Statutory compliance, computed in the run." },
            { label: "Onboarding", note: "Bringing a new employee into the module." },
            { label: "Final settlement", note: "Full-and-final settlement when someone leaves." },
          ],
        },
      ],
    },
    current: true,
  },
  {
    id: "rbh-solutions",
    company: "RBH Solutions Private Limited",
    title: "Full Stack Developer Intern",
    period: "Jun – Jul 2025",
    summary:
      "SCADA software for monitoring industrial equipment remotely. Worked across the admin panel and the customer panel.",
    highlights: [
      "Built role-based screens so each user sees only what their role allows: a super admin view to manage the whole system, a tech team view for the internal technical team, and a customer view limited to a client's own sites and data.",
      "Built and updated screens across the admin panel, where the system is run and configured.",
      "Built several customer-panel screens, the part clients log in to and use.",
    ],
    stack: ["Role-based access control"],
    blueprint: {
      label: "The two panels, and who sees what",
      rows: [
        {
          label: "Panels",
          mode: "flow",
          blocks: [
            { label: "Admin panel", note: "Where the system is run and configured. Built and updated screens here." },
            { label: "Customer panel", note: "What clients log in to. Built several of its screens." },
          ],
        },
        {
          label: "Views by role",
          mode: "lanes",
          blocks: [
            { label: "Super admin", note: "Manages the whole system." },
            { label: "Tech team", note: "The internal technical team's view." },
            { label: "Customer", note: "Limited to a client's own sites and data." },
          ],
        },
      ],
    },
  },
];
