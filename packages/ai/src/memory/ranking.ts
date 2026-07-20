/**
 * Memory ranking (Sprint 5.1, 06_AI_Architecture §11). Scores memories against a query embedding
 * with fixed, explainable weights: cosine similarity plus recency and use-count boosts. No ML —
 * deterministic, so retrieval is reproducible. Time is injected.
 */
import type { Memory } from "../schemas";
import { cosine } from "./embeddings";

/** Weights for the ranking blend (sum need not be 1 — relative magnitudes matter). */
export const RANK_WEIGHTS = {
  similarity: 1,
  recency: 0.2,
  useCount: 0.1,
} as const;

export interface RankedMemory {
  memory: Memory;
  score: number;
  similarity: number;
}

/** Recency boost in [0,1]: 1 if used today, decaying over `halfLifeDays`. */
function recencyBoost(memory: Memory, now: Date, halfLifeDays = 30): number {
  const ref = memory.lastUsedAt ?? memory.createdAt;
  const ageDays = (now.getTime() - new Date(ref).getTime()) / 86_400_000;
  if (ageDays <= 0) return 1;
  return Math.pow(0.5, ageDays / halfLifeDays);
}

/** Use-count boost in [0,1], saturating at 10 uses. */
function useBoost(memory: Memory): number {
  return Math.min(memory.useCount, 10) / 10;
}

/** Rank memories against a query embedding, highest score first. Pure. */
export function rankMemories(
  memories: readonly Memory[],
  queryEmbedding: number[],
  now: Date,
): RankedMemory[] {
  return memories
    .map((memory) => {
      const similarity = cosine(memory.embedding, queryEmbedding);
      const score =
        RANK_WEIGHTS.similarity * similarity +
        RANK_WEIGHTS.recency * recencyBoost(memory, now) +
        RANK_WEIGHTS.useCount * useBoost(memory);
      return { memory, score, similarity };
    })
    .sort((a, b) => b.score - a.score || a.memory.id.localeCompare(b.memory.id));
}
