import "server-only";
import {
  eventsFor,
  healthReport,
  interactionsFor,
  mostConnected,
  upcomingBirthdays,
  upcomingDates,
  type Relationship,
  type RelationshipEvent,
  type RelationshipHealth,
  type RelationshipInteraction,
  type UpcomingDate,
} from "@myos/core/resource";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Server relationship views (Sprint 4.3). The personal CRM's derived reads — health,
 * birthdays, per-contact history and the networking ranking. Strength and engagement are
 * computed by the pure core from counting and calendar maths; there is no scoring model
 * here and there must never be one.
 */

export async function health(db: Database, now = new Date()): Promise<RelationshipHealth[]> {
  const [relationships, interactions] = await Promise.all([
    repo.listRelationships(db),
    repo.listInteractions(db),
  ]);
  return healthReport(relationships, interactions, now);
}

export async function birthdays(db: Database, now = new Date()): Promise<UpcomingDate[]> {
  return upcomingBirthdays(await repo.listRelationships(db), now);
}

/** Every birthday + anniversary, unfiltered — the calendar view. */
export async function allDates(db: Database, now = new Date()): Promise<UpcomingDate[]> {
  return upcomingDates(await repo.listRelationships(db), now);
}

export async function interactionsForRelationship(
  db: Database,
  relationshipId: string,
): Promise<RelationshipInteraction[]> {
  return interactionsFor(await repo.listInteractions(db), relationshipId);
}

export async function eventsForRelationship(
  db: Database,
  relationshipId: string,
): Promise<RelationshipEvent[]> {
  return eventsFor(await repo.listRelationshipEvents(db), relationshipId);
}

export async function connected(
  db: Database,
): Promise<{ relationship: Relationship; events: number }[]> {
  const [relationships, events] = await Promise.all([
    repo.listRelationships(db),
    repo.listRelationshipEvents(db),
  ]);
  return mostConnected(relationships, events);
}
