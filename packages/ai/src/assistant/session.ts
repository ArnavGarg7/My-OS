/**
 * Conversation session (Sprint 5.3). Pure helpers to create conversations and append messages —
 * the state container the server persists. No IO.
 */
import type { Conversation, ConversationMessage, ConversationMode } from "./types";

export function newConversation(
  id: string,
  mode: ConversationMode,
  now: Date,
  title = "New conversation",
): Conversation {
  const iso = now.toISOString();
  return { id, title, mode, messages: [], summary: "", createdAt: iso, updatedAt: iso };
}

export function appendMessage(
  conversation: Conversation,
  message: ConversationMessage,
): Conversation {
  return {
    ...conversation,
    messages: [...conversation.messages, message],
    updatedAt: message.createdAt,
  };
}

export function userMessage(id: string, content: string, now: Date): ConversationMessage {
  return { id, role: "user", content, createdAt: now.toISOString() };
}
