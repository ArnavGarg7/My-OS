/**
 * Assistant streaming (Sprint 5.3, 06 §Streaming / Voice-Ready). A deterministic token stream over
 * a finished answer, so the UI (and future voice adapters) render incrementally with cancellation.
 * Reuses the 5.1 stream manager's chunk shape. Pure generator.
 */
import type { StreamChunk } from "../streaming";

/** Stream an answer word-by-word. Deterministic — same text yields the same chunks. */
export async function* streamAnswer(text: string): AsyncIterable<StreamChunk> {
  const words = text.split(/(\s+)/).filter(Boolean);
  for (const w of words) yield { delta: w, done: false };
  yield { delta: "", done: true };
}
