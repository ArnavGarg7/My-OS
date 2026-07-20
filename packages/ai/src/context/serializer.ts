/**
 * Snapshot serializer (Sprint 5.1, 06_AI_Architecture §4). Deterministic, sorted-key JSON so the
 * same data always produces the same bytes — essential for prompt-cache friendliness. Pure.
 */
import { estimateTokens, stableStringify } from "../text";

export function serializeSnapshotData(data: unknown): {
  serialized: string;
  tokenEstimate: number;
} {
  const serialized = stableStringify(data);
  return { serialized, tokenEstimate: estimateTokens(serialized) };
}
