/**
 * Embedding math for memory (Sprint 5.1). Cosine similarity + the deterministic local embedder.
 * Real Voyage embeddings replace `embedDeterministic` at the provider seam later; the retrieval
 * math here is embedding-source-agnostic. Pure.
 */
export { embedDeterministic } from "../providers/local";

/** Cosine similarity of two equal-length vectors. Returns 0 for degenerate inputs. */
export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
