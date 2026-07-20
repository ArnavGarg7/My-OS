/**
 * Conversation summarizer (Sprint 5.3). Compresses older turns into a rolling summary so long
 * conversations stay within the context budget (06 §Multi-Turn). Deterministic here (extractive:
 * keep the user's requests + key assistant outcomes); a provider may produce a richer summary later
 * via the same seam. Pure.
 */
import type { ConversationMessage } from "./types";

/** Merge a prior summary with a batch of messages being folded out of the window. */
export function updateSummary(
  priorSummary: string,
  folded: readonly ConversationMessage[],
): string {
  const points: string[] = [];
  for (const m of folded) {
    if (m.role === "user") points.push(`User asked: ${truncate(m.content, 80)}`);
    else if (m.role === "assistant") points.push(`Chief: ${truncate(m.content, 80)}`);
  }
  const merged = [priorSummary, ...points].filter(Boolean).join(" · ");
  // Cap the summary so it never grows unbounded.
  return truncate(merged, 1200);
}

function truncate(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}
