import { STRENGTH_WINDOW_DAYS, type InteractionType } from "./constants";
import { addDays, monthKey, round2 } from "./dates";
import type { RelationshipInteraction } from "./types";

/**
 * Interaction engine (Sprint 4.3). Pure aggregations over the contact ledger — frequency,
 * cadence, breakdown by channel and monthly activity. The relationship engine turns these
 * into strength; this module only counts.
 */

export function interactionsFor(
  interactions: RelationshipInteraction[],
  relationshipId: string,
): RelationshipInteraction[] {
  return interactions
    .filter((i) => i.relationshipId === relationshipId)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export function interactionsWithin(
  interactions: RelationshipInteraction[],
  now: Date,
  days: number,
): RelationshipInteraction[] {
  const cutoff = addDays(now, -days);
  return interactions.filter((i) => new Date(i.occurredAt).getTime() >= cutoff.getTime());
}

/** Interactions per month inside the strength window — the cadence you actually keep. */
export function frequencyPerMonth(interactions: RelationshipInteraction[], now: Date): number {
  const recent = interactionsWithin(interactions, now, STRENGTH_WINDOW_DAYS);
  const months = STRENGTH_WINDOW_DAYS / 30;
  return round2(recent.length / months);
}

/** Count by channel — call/meeting/email/…; zero-count types are omitted. */
export function interactionsByType(
  interactions: RelationshipInteraction[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of interactions) out[i.type] = (out[i.type] ?? 0) + 1;
  return out;
}

/** The most-used channel, or null when there is no history. */
export function dominantChannel(interactions: RelationshipInteraction[]): InteractionType | null {
  const counts = interactionsByType(interactions);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top = entries[0];
  return top ? (top[0] as InteractionType) : null;
}

/** Interactions bucketed by YYYY-MM — the analytics activity series. */
export function monthlyActivity(interactions: RelationshipInteraction[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of interactions) {
    const key = monthKey(new Date(i.occurredAt));
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

export function countThisMonth(interactions: RelationshipInteraction[], now: Date): number {
  return monthlyActivity(interactions)[monthKey(now)] ?? 0;
}
