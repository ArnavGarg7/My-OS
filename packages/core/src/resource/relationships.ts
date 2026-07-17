import {
  RELATIONSHIP_ACTIVE_DAYS,
  RELATIONSHIP_COLD_DAYS,
  RELATIONSHIP_DORMANT_DAYS,
  STRENGTH_WINDOW_DAYS,
  STRONG_INTERACTION_COUNT,
  type RelationshipStrength,
} from "./constants";
import { addDays, daysBetween, parseDate } from "./dates";
import type { Relationship, RelationshipHealth, RelationshipInteraction } from "./types";

/**
 * Relationship engine (Sprint 4.3). The personal CRM's derived health, computed by counting
 * and calendar maths — NOT by a scoring model. "Strength" is a band over two observable
 * facts: how recently you spoke, and how often you spoke inside a fixed window. There is no
 * AI here and there must never be: a person is not a prediction.
 */

export function lastInteraction(
  interactions: RelationshipInteraction[],
): RelationshipInteraction | null {
  const ordered = [...interactions].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  return ordered[0] ?? null;
}

export function daysSinceContact(
  interactions: RelationshipInteraction[],
  now: Date,
): number | null {
  const last = lastInteraction(interactions);
  if (!last) return null;
  return daysBetween(new Date(last.occurredAt), now);
}

/** Interactions inside the rolling strength window. */
export function recentCount(interactions: RelationshipInteraction[], now: Date): number {
  const cutoff = addDays(now, -STRENGTH_WINDOW_DAYS);
  return interactions.filter((i) => new Date(i.occurredAt).getTime() >= cutoff.getTime()).length;
}

/**
 * Strength band. Recency gates the ceiling — you cannot be "strong" with someone you have
 * not spoken to in three months, however often you spoke before that.
 */
export function strengthOf(
  interactions: RelationshipInteraction[],
  now: Date,
): RelationshipStrength {
  const since = daysSinceContact(interactions, now);
  if (since === null || since >= RELATIONSHIP_DORMANT_DAYS) return "dormant";
  if (since >= RELATIONSHIP_COLD_DAYS) return "cooling";
  const count = recentCount(interactions, now);
  if (since <= RELATIONSHIP_ACTIVE_DAYS && count >= STRONG_INTERACTION_COUNT) return "strong";
  return "active";
}

/**
 * Engagement 0–100 = recency (60) + frequency (40). Recency decays linearly to zero at the
 * dormant threshold; frequency saturates at STRONG_INTERACTION_COUNT. Both halves are
 * transparent arithmetic the Explain panel can restate in a sentence.
 */
export function engagementScore(interactions: RelationshipInteraction[], now: Date): number {
  const since = daysSinceContact(interactions, now);
  if (since === null) return 0;
  const recency = Math.max(0, 1 - since / RELATIONSHIP_DORMANT_DAYS) * 60;
  const frequency = Math.min(1, recentCount(interactions, now) / STRONG_INTERACTION_COUNT) * 40;
  return Math.round(recency + frequency);
}

/** A follow-up is due when the explicit date has arrived. */
export function followUpDue(relationship: Relationship, now: Date): boolean {
  if (!relationship.nextFollowUpAt) return false;
  return daysBetween(now, parseDate(relationship.nextFollowUpAt)) <= 0;
}

export function healthOf(
  relationship: Relationship,
  interactions: RelationshipInteraction[],
  now: Date,
): RelationshipHealth {
  const mine = interactions.filter((i) => i.relationshipId === relationship.id);
  const last = lastInteraction(mine);
  return {
    relationshipId: relationship.id,
    name: relationship.name,
    strength: strengthOf(mine, now),
    interactionCount: recentCount(mine, now),
    daysSinceContact: daysSinceContact(mine, now),
    lastInteractionAt: last?.occurredAt ?? null,
    engagementScore: engagementScore(mine, now),
    followUpDue: followUpDue(relationship, now),
  };
}

/** Health for every active relationship, weakest first — the list worth acting on. */
export function healthReport(
  relationships: Relationship[],
  interactions: RelationshipInteraction[],
  now: Date,
): RelationshipHealth[] {
  return relationships
    .filter((r) => !r.archived)
    .map((r) => healthOf(r, interactions, now))
    .sort((a, b) => a.engagementScore - b.engagementScore);
}

export function strongRelationships(report: RelationshipHealth[]): RelationshipHealth[] {
  return report.filter((h) => h.strength === "strong");
}

export function dormantRelationships(report: RelationshipHealth[]): RelationshipHealth[] {
  return report.filter((h) => h.strength === "dormant");
}

/** People who have gone quiet — the input to the relationship-cold decision rule. */
export function coldRelationships(report: RelationshipHealth[]): RelationshipHealth[] {
  return report.filter((h) => h.strength === "cooling" || h.strength === "dormant");
}

export function followUpsDue(report: RelationshipHealth[]): RelationshipHealth[] {
  return report.filter((h) => h.followUpDue);
}
