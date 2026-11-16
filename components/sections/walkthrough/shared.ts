import type { ImageStep, LogKind, VideoFlow } from "@/lib/content/client-work";

const IMAGE_BASE_MS = 3600;
const IMAGE_PER_LINE_MS = 520;

/** How long the tour dwells on a still frame: time to read the title plus its trace. */
export const imageStepMs = (step: ImageStep) => IMAGE_BASE_MS + step.log.length * IMAGE_PER_LINE_MS;

export const kindLabel: Record<LogKind, string> = {
  req: "req",
  auth: "auth",
  perm: "perm",
  scope: "scope",
  check: "check",
  db: "sql",
  audit: "audit",
  res: "res",
  deny: "deny",
  note: "note",
};

export const kindTone: Record<LogKind, string> = {
  req: "text-accent",
  auth: "text-ink-dim",
  perm: "text-ink-dim",
  scope: "text-ink-dim",
  check: "text-ink-dim",
  db: "text-ink-dim",
  audit: "text-redline",
  res: "text-accent",
  deny: "text-redline",
  note: "text-ink-faint",
};

/** The step whose timestamp the video clock has most recently crossed. */
export const stepIndexAt = (flow: VideoFlow, t: number) => {
  let index = 0;
  flow.steps.forEach((step, i) => {
    if (t + 0.05 >= step.at) index = i;
  });
  return index;
};

export const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";
