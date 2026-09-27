/*
  Live projects only. This list is empty until something is deployed, and the Projects
  section renders nothing while it is empty. There are no "coming soon" cards.

  Adding a project is a data change: push an entry here and the section appears between
  Research and Skills. Every entry needs a live link. `outcome` stays unset unless there is
  a real number to put in it.
*/

export type FlowNode = { label: string; note: string };

export type Project = {
  id: string;
  name: string;
  period: string;
  status: string;
  kind: string;
  /** Shown while the entry is collapsed. */
  summary: string;
  problem: string;
  approach: string[];
  architecture: FlowNode[];
  role: string;
  stack: string[];
  tradeoff: string;
  outcome?: string;
  screenshot?: { src: string; alt: string };
  live?: { href: string };
  repo?: { href: string };
  repoNote?: string;
  paper?: { href: string };
};

export const projects: Project[] = [];
