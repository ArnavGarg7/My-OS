import { STUDIO_STEPS, type StudioStep } from "./constants";

/**
 * Tomorrow quick parser (Sprint 3.1). Deterministic mapping of free text to a
 * studio step for the Command Center + Quick Tomorrow. No NLP.
 */
const ALIASES: Record<string, StudioStep> = {
  review: "review",
  today: "review",
  carry: "carry_forward",
  forward: "carry_forward",
  unfinished: "carry_forward",
  priorities: "priorities",
  priority: "priorities",
  calendar: "calendar",
  meetings: "calendar",
  planner: "planner",
  plan: "planner",
  preview: "planner",
  readiness: "readiness",
  ready: "readiness",
  checklist: "checklist",
  finalize: "finalize",
  finish: "finalize",
  lock: "finalize",
};

export function parseStep(query: string): StudioStep | null {
  const q = query.trim().toLowerCase();
  if ((STUDIO_STEPS as readonly string[]).includes(q)) return q as StudioStep;
  // Match against whole words so "preview" doesn't trip the "review" alias.
  const words = q.split(/[^a-z]+/).filter(Boolean);
  for (const word of words) {
    const step = ALIASES[word];
    if (step) return step;
  }
  return null;
}
