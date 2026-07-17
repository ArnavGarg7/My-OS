import type { Collection } from "./types";

/**
 * Collections (Sprint 4.4). User-defined groupings — "Semester", "Fitness", "Masters" — that
 * REFERENCE existing entities rather than copying them. A collection stores only ids into
 * other modules; it never duplicates their data, so a task shown in a collection is the same
 * task, not a snapshot of it. Pure operations over the ref list; the engine constructs rows.
 */

export function addRef(
  collection: Collection,
  ref: { module: string; id: string },
  now: Date,
): Collection {
  // Ignore duplicates — a collection is a set of references, not a bag.
  if (collection.entityRefs.some((r) => r.module === ref.module && r.id === ref.id)) {
    return collection;
  }
  return {
    ...collection,
    entityRefs: [...collection.entityRefs, ref],
    updatedAt: now.toISOString(),
  };
}

export function removeRef(
  collection: Collection,
  ref: { module: string; id: string },
  now: Date,
): Collection {
  return {
    ...collection,
    entityRefs: collection.entityRefs.filter((r) => !(r.module === ref.module && r.id === ref.id)),
    updatedAt: now.toISOString(),
  };
}

export function refsForModule(collection: Collection, module: string): string[] {
  return collection.entityRefs.filter((r) => r.module === module).map((r) => r.id);
}

export function moduleCounts(collection: Collection): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of collection.entityRefs) out[r.module] = (out[r.module] ?? 0) + 1;
  return out;
}

export function collectionSize(collection: Collection): number {
  return collection.entityRefs.length;
}
