import type { Relationship, RelationshipEvent } from "./types";

/**
 * Networking engine (Sprint 4.3). The professional ledger layered over the CRM: conferences
 * attended, referrals given and received, introductions made, collaborations and
 * recruitment. Pure grouping and counting over `RelationshipEvent` — the platform records
 * what happened; it does not rank people.
 */

export const NETWORKING_KINDS = [
  "conference",
  "referral",
  "introduction",
  "collaboration",
  "recruitment",
] as const;
export type NetworkingKind = (typeof NETWORKING_KINDS)[number];

export function eventsByKind(events: RelationshipEvent[], kind: string): RelationshipEvent[] {
  return events
    .filter((e) => e.kind === kind)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

export function countEventsByKind(events: RelationshipEvent[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of events) out[e.kind] = (out[e.kind] ?? 0) + 1;
  return out;
}

export function eventsFor(
  events: RelationshipEvent[],
  relationshipId: string,
): RelationshipEvent[] {
  return events
    .filter((e) => e.relationshipId === relationshipId)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

/** Distinct conferences on record, most recent first. */
export function conferences(events: RelationshipEvent[]): RelationshipEvent[] {
  return eventsByKind(events, "conference");
}

export function referrals(events: RelationshipEvent[]): RelationshipEvent[] {
  return eventsByKind(events, "referral");
}

export function introductions(events: RelationshipEvent[]): RelationshipEvent[] {
  return eventsByKind(events, "introduction");
}

/** The professional slice of the CRM — who you know through work. */
export function professionalContacts(relationships: Relationship[]): Relationship[] {
  const professional = new Set(["colleague", "manager", "recruiter", "investor", "networking"]);
  return relationships.filter((r) => !r.archived && professional.has(r.type));
}

/** People with the most networking events — your densest professional ties. */
export function mostConnected(
  relationships: Relationship[],
  events: RelationshipEvent[],
  limit = 5,
): { relationship: Relationship; events: number }[] {
  return relationships
    .filter((r) => !r.archived)
    .map((r) => ({ relationship: r, events: eventsFor(events, r.id).length }))
    .filter((x) => x.events > 0)
    .sort((a, b) => b.events - a.events)
    .slice(0, limit);
}
