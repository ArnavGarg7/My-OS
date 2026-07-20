import "server-only";
import type { Database } from "@myos/db";
import {
  runTurn,
  defaultAiSettings,
  type ChatInput,
  type ConversationFeedback,
} from "@myos/ai/assistant";
import { getAiEngine } from "../ai/engine";
import { assistantPolicyInputs, getAssistantRegistry } from "./engine";
import { ASSISTANT_GRANTS, buildToolRegistry } from "./tool-handlers";
import { configuredProviders } from "./providers";
import {
  conversationHistory,
  listConversations,
  loadOrCreateConversation,
  recordConversationFeedback,
  recordTurn,
} from "./repository";

/**
 * Assistant service (Sprint 5.3). Orchestrates the conversational engine: build the grounded tool
 * registry from the deterministic services → run the turn on the resolved provider (Provider Policy)
 * → persist the conversation → log telemetry through the 5.1 pipeline. Owns no business logic; every
 * answer is grounded in tool results, mutations are proposals, and the Local provider serves when no
 * cloud key is configured.
 */

function logInteraction(feature: string, provider: string, latencyMs: number): void {
  getAiEngine().telemetry.record({
    requestId: `asst_${Date.now().toString(36)}`,
    feature,
    provider,
    model: provider === "local" ? "local-deterministic" : provider,
    promptVersion: "system.assistant@1",
    inputTokens: 0,
    outputTokens: 0,
    cachedTokens: 0,
    latencyMs,
    retries: 0,
    repairCount: 0,
    toolCalls: 0,
    toolTimeMs: 0,
    costUsd: 0,
    status: "ok",
  });
}

/** assistant.chat — one conversational turn, grounded + persisted. */
export async function chat(db: Database, tz: string, name: string, input: ChatInput) {
  const now = new Date();
  const registry = buildToolRegistry(db, tz, name);
  const conversation = await loadOrCreateConversation(
    db,
    input.conversationId,
    input.mode ?? "chief",
    now,
  );

  const turn = await runTurn(conversation, input.message, {
    registry,
    policy: assistantPolicyInputs(),
    granted: ASSISTANT_GRANTS,
    now: () => now,
  });

  const sessionId = await recordTurn(db, conversation.id, input.message, turn).catch(() => "");
  const latency = Date.now() - now.getTime();
  logInteraction("assistant.chat", turn.provider, latency);

  return { conversationId: conversation.id, sessionId, turn };
}

/** assistant.history — recent conversations + one conversation's turns. */
export async function history(db: Database, conversationId?: string) {
  if (conversationId)
    return { conversations: [], turns: await conversationHistory(db, conversationId) };
  return { conversations: await listConversations(db), turns: [] };
}

/** assistant.providers — configured status + live health (never exposes keys). */
export async function providers() {
  const configured = configuredProviders();
  const health = await getAssistantRegistry().healthAll();
  return health.map((h) => ({
    provider: h.provider,
    configured: configured[h.provider] ?? false,
    state: h.state,
    detail: h.detail,
  }));
}

/** assistant.settings — the AI settings + which providers are configured (keys never returned). */
export function settings() {
  return { settings: defaultAiSettings(), configured: configuredProviders() };
}

/** assistant.feedback — record feedback on an assistant message. */
export async function feedback(db: Database, fb: ConversationFeedback) {
  await recordConversationFeedback(db, fb.messageId, fb.outcome, fb.note);
  return { ok: true };
}
