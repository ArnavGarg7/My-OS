/**
 * Adaptation Timeline (Sprint 6.5). A deterministic, append-only audit of adaptation events — every
 * time a preference is learned/updated/disabled, a habit changes band, or feedback lands. Makes the
 * profile auditable + reversible (spec §Architecture Review: "adaptation models are versioned and
 * auditable"). Pure — no IO; the server persists these.
 */
import type { AdaptationDeps } from "./types";

export type AdaptationEventKind =
  | "preference_learned"
  | "preference_updated"
  | "preference_disabled"
  | "habit_changed"
  | "routine_discovered"
  | "feedback_received"
  | "insight_generated";

export interface AdaptationEvent {
  id: string;
  kind: AdaptationEventKind;
  subject: string;
  detail: string;
  at: string;
}

/** Build an adaptation event (deterministic id + injected timestamp). */
export function adaptationEvent(
  kind: AdaptationEventKind,
  subject: string,
  detail: string,
  at: Date,
  deps: AdaptationDeps,
): AdaptationEvent {
  return { id: deps.newId(), kind, subject, detail, at: at.toISOString() };
}
