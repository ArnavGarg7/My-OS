/**
 * Automation Registry (Sprint 6.3, spec §Automation Registry). The built-in automations, registered
 * once and immutable. Sprint 6.3 ships only LOW-RISK, reversible automations — matching the spec's
 * "trusted by default candidates" (archive completed notifications, dismiss expired signals, mark
 * stale opportunities, refresh caches/dashboards). High-risk verbs (move tasks, change calendar,
 * delete data, modify goals) are intentionally NOT registered here — they always require approval and
 * arrive in a later sprint. Pure data.
 */
import type { Automation } from "./types";

export const AUTOMATIONS: readonly Automation[] = [
  {
    id: "dismiss-expired-signal",
    name: "Dismiss expired signals",
    description: "Acknowledge a signal that has passed its expiry so the feed stays clean.",
    trigger: "signal_created",
    conditions: [{ fact: "signal.expired", op: "eq", value: true }],
    actions: [
      {
        kind: "dismiss_expired_signal",
        label: "Acknowledge the expired signal",
        params: {},
        mutating: true,
      },
    ],
    reversible: true,
    permissions: ["write:signals"],
    risk: "low",
    category: "hygiene",
    version: "1",
    status: "active",
    defaultPolicy: "always_ask",
  },
  {
    id: "mark-stale-opportunity",
    name: "Mark stale opportunities",
    description: "Acknowledge an opportunity signal that is no longer actionable.",
    trigger: "signal_created",
    conditions: [
      { fact: "signal.category", op: "eq", value: "opportunities" },
      { fact: "signal.stale", op: "eq", value: true },
    ],
    actions: [
      {
        kind: "mark_stale_opportunity",
        label: "Acknowledge the stale opportunity",
        params: {},
        mutating: true,
      },
    ],
    reversible: true,
    permissions: ["write:signals"],
    risk: "low",
    category: "hygiene",
    version: "1",
    status: "active",
    defaultPolicy: "always_ask",
  },
  {
    id: "refresh-prediction-cache",
    name: "Refresh prediction cache",
    description: "Recompute the forecast run so predictions reflect the latest read models.",
    trigger: "prediction_created",
    conditions: [],
    actions: [
      {
        kind: "refresh_prediction_cache",
        label: "Recompute forecasts",
        params: {},
        mutating: false,
      },
    ],
    reversible: true,
    permissions: ["read:prediction"],
    risk: "low",
    category: "maintenance",
    version: "1",
    status: "active",
    defaultPolicy: "always_ask",
  },
  {
    id: "archive-completed-notification",
    name: "Archive completed notifications",
    description: "Archive a notification the user has already acted on.",
    trigger: "manual",
    conditions: [{ fact: "notification.completed", op: "eq", value: true }],
    actions: [
      {
        kind: "archive_completed_notification",
        label: "Archive the completed notification",
        params: {},
        mutating: true,
      },
    ],
    reversible: true,
    permissions: ["write:notifications"],
    risk: "low",
    category: "hygiene",
    version: "1",
    status: "active",
    defaultPolicy: "always_ask",
  },
];

/** Look up a registered automation by id. */
export function getAutomation(id: string): Automation | null {
  return AUTOMATIONS.find((a) => a.id === id) ?? null;
}

/** Automations whose trigger matches. */
export function automationsForTrigger(trigger: Automation["trigger"]): Automation[] {
  return AUTOMATIONS.filter((a) => a.status === "active" && a.trigger === trigger);
}
