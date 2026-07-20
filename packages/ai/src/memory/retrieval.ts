/**
 * Memory retrieval (Sprint 5.1, 06_AI_Architecture §11). Embeds a query, ranks candidate memories,
 * and returns the top-k with `lastUsedAt`/`useCount` bumps applied to the returned copies (the
 * server persists the bumps). Retrieval is independent of any conversational UI — this is pure
 * infrastructure. Time and the embedder are injected.
 */
import type { Memory } from "../schemas";
import { embedDeterministic } from "./embeddings";
import { rankMemories, type RankedMemory } from "./ranking";

export interface RetrieveOptions {
  k?: number;
  now?: Date;
  /** Override the embedder (e.g. inject Voyage later). Defaults to the deterministic local one. */
  embed?: (text: string) => number[];
  /** Vector dims for the default embedder. */
  dims?: number;
}

export interface RetrievalResult {
  ranked: RankedMemory[];
  /** Copies of the retrieved memories with usage bumps applied (persist these). */
  bumped: Memory[];
}

/** Retrieve the top-k memories relevant to `query`. Pure; returns bump copies, does not mutate. */
export function retrieveMemories(
  memories: readonly Memory[],
  query: string,
  opts: RetrieveOptions = {},
): RetrievalResult {
  const k = opts.k ?? 6;
  const now = opts.now ?? new Date();
  const embed = opts.embed ?? ((t: string) => embedDeterministic(t, opts.dims ?? 256));
  const queryEmbedding = embed(query);
  const ranked = rankMemories(memories, queryEmbedding, now).slice(0, k);
  const bumped = ranked.map((r) => ({
    ...r.memory,
    lastUsedAt: now.toISOString(),
    useCount: r.memory.useCount + 1,
  }));
  return { ranked, bumped };
}
