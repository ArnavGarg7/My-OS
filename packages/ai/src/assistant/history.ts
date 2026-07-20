/**
 * Conversation history windowing (Sprint 5.3, 06_AI_Architecture §5). Keeps the last N messages in
 * the live window; older turns are represented by the rolling summary to keep context small. Pure.
 */
import type { Conversation, ConversationMessage } from "./types";

export const HISTORY_WINDOW = 30;

export interface HistoryWindow {
  /** The recent messages sent to the provider. */
  window: ConversationMessage[];
  /** Number of older messages folded into the summary. */
  summarizedCount: number;
  summary: string;
}

/** Return the live window + how many older messages are summarized. */
export function windowHistory(conversation: Conversation, max = HISTORY_WINDOW): HistoryWindow {
  const messages = conversation.messages;
  if (messages.length <= max) {
    return { window: messages, summarizedCount: 0, summary: conversation.summary };
  }
  return {
    window: messages.slice(-max),
    summarizedCount: messages.length - max,
    summary: conversation.summary,
  };
}
