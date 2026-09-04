/**
 * Intelligence → action resolver (Stage 3). PURE, UI-free mapping from a piece of
 * intelligence (a Chief recommendation, or a Signal about an entity) to the
 * concrete executable target inside My OS. Keeping this pure means the same
 * capability powers the UI today and a voice/assistant interface later
 * (voice → intelligence → action reuses UI → intelligence → action), and it is
 * unit-testable without React.
 *
 * It never invents targets: if the intelligence doesn't ground to something the
 * OS can act on, it resolves to `null` and the caller shows explanation only.
 */

/** A resolved, executable target. */
export type IntelTarget =
  | { kind: "focus"; taskId: string; label: string }
  | { kind: "navigate"; href: string; label: string };

/** An entity reference carried by a recommendation or signal. */
export interface EntityRef {
  module: string;
  id: string;
  label?: string | undefined;
}

/** Route a module reference points at (non-focus modules). */
const MODULE_ROUTE: Record<string, string> = {
  decision: "/today#morning-recommendation",
  planner: "/planner",
  calendar: "/calendar",
  event: "/calendar",
  project: "/projects",
  goal: "/goals",
  inbox: "/inbox",
  focus: "/focus",
  journal: "/journal",
};

/** Where a Chief recommendation action leads when it has no task to execute. */
const ACTION_ROUTE: Record<string, { href: string; label: string }> = {
  start_focus: { href: "/focus", label: "Start a focus session" },
  start_block: { href: "/planner", label: "Start this block" },
  take_break: { href: "/today", label: "Take a break" },
  reschedule: { href: "/planner", label: "Rescue my day" },
  review: { href: "/today#morning-recommendation", label: "Review decisions" },
  plan: { href: "/tomorrow", label: "Plan tomorrow" },
};

/**
 * Resolve a Chief recommendation to its executable target. `start_focus` on a
 * specific task executes it directly (the Stage 2 seam); everything else routes
 * to the surface that owns the action.
 */
export function resolveRecommendationTarget(
  action: string,
  ref?: EntityRef | null,
  estimateMinutes?: number | null,
): IntelTarget | null {
  if (action === "start_focus" && ref?.module === "task") {
    return {
      kind: "focus",
      taskId: ref.id,
      label: ref.label ? `Focus on ${ref.label}` : "Start focus session",
    };
  }
  const route = ACTION_ROUTE[action];
  if (route) return { kind: "navigate", href: route.href, label: route.label };
  // A bare task reference is still executable even without a known action.
  if (ref?.module === "task") {
    return { kind: "focus", taskId: ref.id, label: "Start focus session" };
  }
  void estimateMinutes;
  return null;
}

/**
 * Resolve a Signal's primary entity to an executable target. A task the signal is
 * about → focus on it; anything else → open the surface that owns it. Returns
 * null when the signal grounds to nothing actionable (pure situational awareness).
 */
export function resolveSignalTarget(relatedObjects: readonly EntityRef[]): IntelTarget | null {
  const primary = relatedObjects[0];
  if (!primary) return null;
  if (primary.module === "task") {
    return {
      kind: "focus",
      taskId: primary.id,
      label: primary.label ? `Focus on ${primary.label}` : "Focus on it",
    };
  }
  const href = MODULE_ROUTE[primary.module];
  if (!href) return null;
  const label =
    primary.module === "decision"
      ? "Review decisions"
      : primary.label
        ? `Open ${primary.label}`
        : `Open ${primary.module}`;
  return { kind: "navigate", href, label };
}
