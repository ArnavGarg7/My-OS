/**
 * @myos/ai/assistant — the Conversational Chief of Staff (Sprint 5.3). The conversational interface
 * to My OS: multi-turn conversations, deterministic tool-calling for grounding (never hallucination),
 * mode-based context routing, citations, streaming, and proposal workflows. Every answer is built
 * from real tool results; if the OS doesn't know, the Chief says so. The AI reasons; the operating
 * system owns the truth. Runs fully on the Local provider offline; cloud providers plug in via the
 * Provider Policy without changing the loop.
 */
export * from "./types";
export { cite, dedupeCitations, type Citation } from "./citations";
export {
  classifyMode,
  planIntent,
  MODE_CONFIG,
  type IntentPlan,
  type IntentKind,
  type ModeConfig,
} from "./context-router";
export { runToolLoop, type ToolLoopResult, type ToolLoopOptions } from "./tool-loop";
export { composeAnswer, type ReasonedAnswer } from "./reasoning";
export { runTurn, type RunTurnDeps } from "./chief-chat";
export { newConversation, appendMessage, userMessage } from "./session";
export { windowHistory, HISTORY_WINDOW, type HistoryWindow } from "./history";
export { updateSummary } from "./summarizer";
export { analyzeTurns, type ConversationAnalytics } from "./analytics";
export { defaultAiSettings, type AiSettings, type ProviderStatus } from "./settings";
export { noopVoiceAdapter, type VoiceAdapter } from "./voice";
export { streamAnswer } from "./stream";
export {
  chatInputSchema,
  conversationFeedbackSchema,
  aiSettingsSchema,
  conversationModeSchema,
  type ChatInput,
  type ConversationFeedback,
} from "./schemas";
