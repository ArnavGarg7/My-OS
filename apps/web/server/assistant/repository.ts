import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import { aiConversations, assistantSessions, conversationFeedback } from "@myos/db/schema";
import type { AssistantTurn, Conversation, ConversationMode } from "@myos/ai/assistant";

/**
 * Assistant repository (Sprint 5.3). Persists conversations, assistant turns and feedback. Provider
 * credentials live in their own encrypted table (server-only) — never read into a response here.
 */

/** Load a conversation (with its messages) or create a new one. */
export async function loadOrCreateConversation(
  db: Database,
  id: string | undefined,
  mode: ConversationMode,
  now: Date,
): Promise<Conversation> {
  if (id) {
    const [row] = await db
      .select()
      .from(aiConversations)
      .where(eq(aiConversations.id, id))
      .limit(1);
    if (row) {
      const sessions = await db
        .select()
        .from(assistantSessions)
        .where(eq(assistantSessions.conversationId, id))
        .orderBy(assistantSessions.createdAt);
      return {
        id: row.id,
        title: row.title,
        mode: row.mode as ConversationMode,
        summary: row.summary,
        messages: sessions.map((s) => ({
          id: s.id,
          role: s.role as "assistant" | "user",
          content: s.content,
          createdAt: s.createdAt.toISOString(),
        })),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    }
  }
  const [created] = await db.insert(aiConversations).values({ mode }).returning();
  const iso = now.toISOString();
  return {
    id: created!.id,
    title: created!.title,
    mode,
    summary: "",
    messages: [],
    createdAt: iso,
    updatedAt: iso,
  };
}

/** Persist the user message + assistant turn as two rows; returns the assistant session id. */
export async function recordTurn(
  db: Database,
  conversationId: string,
  userText: string,
  turn: AssistantTurn,
): Promise<string> {
  await db
    .insert(assistantSessions)
    .values({ conversationId, role: "user", content: userText, mode: turn.mode });
  const [assistant] = await db
    .insert(assistantSessions)
    .values({
      conversationId,
      role: "assistant",
      content: turn.message.content,
      provider: turn.provider,
      mode: turn.mode,
      grounded: turn.grounded,
      unknownAnswer: turn.unknown,
      toolCalls: turn.message.toolCalls ?? [],
      citations: turn.message.citations ?? [],
      proposal: turn.proposal ?? null,
    })
    .returning({ id: assistantSessions.id });
  await db
    .update(aiConversations)
    .set({ updatedAt: new Date() })
    .where(eq(aiConversations.id, conversationId));
  return assistant!.id;
}

/** List recent conversations (id + title + mode). */
export async function listConversations(db: Database, limit = 20) {
  return db
    .select({
      id: aiConversations.id,
      title: aiConversations.title,
      mode: aiConversations.mode,
      updatedAt: aiConversations.updatedAt,
    })
    .from(aiConversations)
    .orderBy(desc(aiConversations.updatedAt))
    .limit(limit);
}

/** The turns of one conversation (for the history view). */
export async function conversationHistory(db: Database, conversationId: string) {
  return db
    .select()
    .from(assistantSessions)
    .where(eq(assistantSessions.conversationId, conversationId))
    .orderBy(assistantSessions.createdAt);
}

/** Record feedback on an assistant message. */
export async function recordConversationFeedback(
  db: Database,
  sessionId: string,
  outcome: string,
  note?: string,
): Promise<void> {
  await db.insert(conversationFeedback).values({ sessionId, outcome, note: note ?? null });
}
