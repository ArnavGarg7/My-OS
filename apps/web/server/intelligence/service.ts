import "server-only";
import { randomUUID } from "node:crypto";
import {
  addRef,
  createIntelligenceEngine,
  removeRef,
  type Collection,
  type DashboardPreferences,
  type DashboardWidget,
} from "@myos/core/intelligence";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Intelligence service (Sprint 4.4). Orchestrates the config engine + persistence for the
 * ONLY stored things: dashboard layout and collections. Every dashboard view is computed on
 * read elsewhere; this file touches config only, keeping business data isolated from layout.
 */

const engine = createIntelligenceEngine({ newId: () => randomUUID(), now: () => new Date() });

/* ── Dashboard preferences ──────────────────────────────────────────────── */

/** Load layout, reconciling it against the current widget set, seeding a default if absent. */
export async function preferences(db: Database): Promise<DashboardPreferences> {
  const stored = await repo.getPreferences(db);
  if (!stored) return repo.savePreferences(db, engine.defaultPreferences());
  return engine.reconcilePreferences(stored);
}

export async function savePreferences(
  db: Database,
  input: { widgetOrder: DashboardWidget[]; hiddenWidgets?: DashboardWidget[] },
): Promise<DashboardPreferences> {
  return repo.savePreferences(db, {
    widgetOrder: input.widgetOrder,
    hiddenWidgets: input.hiddenWidgets ?? [],
    updatedAt: new Date().toISOString(),
  });
}

/* ── Collections ────────────────────────────────────────────────────────── */

export async function listCollections(db: Database): Promise<Collection[]> {
  return repo.listCollections(db);
}

export async function createCollection(
  db: Database,
  input: { name: string; entityRefs?: { module: string; id: string }[] },
): Promise<Collection> {
  return repo.insertCollection(db, engine.makeCollection(input));
}

export async function updateCollection(
  db: Database,
  id: string,
  patch: Partial<Collection>,
): Promise<Collection | null> {
  return repo.updateCollectionRow(db, id, patch);
}

export async function addToCollection(
  db: Database,
  id: string,
  ref: { module: string; id: string },
): Promise<Collection | null> {
  const collection = (await repo.listCollections(db)).find((c) => c.id === id);
  if (!collection) return null;
  const next = addRef(collection, ref, new Date());
  return repo.updateCollectionRow(db, id, { entityRefs: next.entityRefs });
}

export async function removeFromCollection(
  db: Database,
  id: string,
  ref: { module: string; id: string },
): Promise<Collection | null> {
  const collection = (await repo.listCollections(db)).find((c) => c.id === id);
  if (!collection) return null;
  const next = removeRef(collection, ref, new Date());
  return repo.updateCollectionRow(db, id, { entityRefs: next.entityRefs });
}

export async function deleteCollection(db: Database, id: string): Promise<{ id: string }> {
  await repo.deleteCollection(db, id);
  return { id };
}
