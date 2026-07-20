/**
 * Memory hygiene (Sprint 5.1, 06_AI_Architecture §11). Deterministic dedup, contradiction handling
 * (a newer memory supersedes an older near-identical one) and the 200-memory cap. Pure — returns a
 * cleaned set plus the ids to soft-delete; the server applies the changes.
 */
import type { Memory } from "../schemas";
import { cosine } from "./embeddings";

export const MAX_ACTIVE_MEMORIES = 200;
/** Cosine ≥ this between same-kind memories is treated as a contradiction/duplicate. */
export const SUPERSEDE_THRESHOLD = 0.92;

export interface HygieneResult {
  kept: Memory[];
  /** Ids the caller should soft-delete (superseded or over-cap). */
  removedIds: string[];
}

/**
 * Reconcile a memory set: within each kind, a newer memory supersedes an older near-identical one;
 * then cap the total, dropping the least-recently-used first. Deterministic.
 */
export function reconcileMemories(
  memories: readonly Memory[],
  max = MAX_ACTIVE_MEMORIES,
): HygieneResult {
  const removed = new Set<string>();
  const byKind = new Map<string, Memory[]>();
  for (const m of memories) {
    const list = byKind.get(m.kind) ?? [];
    list.push(m);
    byKind.set(m.kind, list);
  }
  for (const list of byKind.values()) {
    // Newest first so the earlier (newer) one wins a supersede.
    const sorted = [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    for (let i = 0; i < sorted.length; i += 1) {
      const a = sorted[i]!;
      if (removed.has(a.id)) continue;
      for (let j = i + 1; j < sorted.length; j += 1) {
        const b = sorted[j]!;
        if (removed.has(b.id)) continue;
        if (cosine(a.embedding, b.embedding) >= SUPERSEDE_THRESHOLD) {
          removed.add(b.id);
        }
      }
    }
  }

  let kept = memories.filter((m) => !removed.has(m.id));
  if (kept.length > max) {
    // Drop least-recently-used (oldest lastUsedAt/createdAt) beyond the cap.
    const lru = [...kept].sort((a, b) => lastTouch(a) - lastTouch(b));
    for (const m of lru.slice(0, kept.length - max)) removed.add(m.id);
    kept = kept.filter((m) => !removed.has(m.id));
  }
  return { kept, removedIds: [...removed] };
}

function lastTouch(m: Memory): number {
  return new Date(m.lastUsedAt ?? m.createdAt).getTime();
}
