/**
 * Conversation analytics (Sprint 5.3, 06 §Conversation Analytics). Aggregates conversation turns —
 * counts, tool usage, provider usage, grounding rate, proposal rate, unknown rate. Pure.
 */
import type { AssistantTurn } from "./types";

export interface ConversationAnalytics {
  turns: number;
  grounded: number;
  unknown: number;
  proposals: number;
  toolCalls: number;
  byProvider: Record<string, number>;
  byMode: Record<string, number>;
  groundingRate: number;
}

export function analyzeTurns(turns: readonly AssistantTurn[]): ConversationAnalytics {
  const a: ConversationAnalytics = {
    turns: turns.length,
    grounded: 0,
    unknown: 0,
    proposals: 0,
    toolCalls: 0,
    byProvider: {},
    byMode: {},
    groundingRate: 0,
  };
  for (const t of turns) {
    if (t.grounded) a.grounded += 1;
    if (t.unknown) a.unknown += 1;
    if (t.proposal) a.proposals += 1;
    a.toolCalls += t.message.toolCalls?.length ?? 0;
    a.byProvider[t.provider] = (a.byProvider[t.provider] ?? 0) + 1;
    a.byMode[t.mode] = (a.byMode[t.mode] ?? 0) + 1;
  }
  a.groundingRate = turns.length ? Math.round((a.grounded / turns.length) * 100) / 100 : 0;
  return a;
}
