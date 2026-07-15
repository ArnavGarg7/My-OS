import { STEP_LABEL, STUDIO_STEPS, type StudioStep, type TomorrowStatus } from "./constants";
import type { CarryForwardList, PrioritySelection } from "./types";

/**
 * Tomorrow selectors (Sprint 3.1). Read helpers for the UI + status bar: step
 * metadata, status labels and small derived counts. Deterministic.
 */
export function stepList(): { step: StudioStep; label: string; index: number }[] {
  return STUDIO_STEPS.map((step, index) => ({ step, label: STEP_LABEL[step], index }));
}

export function statusLabel(status: TomorrowStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "planned":
      return "Planned";
    case "locked":
      return "Locked";
    case "completed":
      return "Completed";
  }
}

export function isEditable(status: TomorrowStatus): boolean {
  return status === "draft" || status === "planned";
}

/** The top carry-forward reasons for a compact summary. */
export function carryForwardHeadline(list: CarryForwardList): string {
  if (list.total === 0) return "Nothing to carry forward — a clean close.";
  const parts: string[] = [];
  if (list.byKind.task) parts.push(`${list.byKind.task} task${list.byKind.task === 1 ? "" : "s"}`);
  if (list.byKind.milestone) parts.push(`${list.byKind.milestone} milestone(s)`);
  if (list.byKind.decision) parts.push(`${list.byKind.decision} decision(s)`);
  if (list.byKind.inbox) parts.push(`${list.byKind.inbox} inbox item(s)`);
  return parts.join(" · ") || `${list.total} item(s)`;
}

export function priorityTitles(selection: PrioritySelection): string[] {
  return selection.top.map((p) => p.title);
}
