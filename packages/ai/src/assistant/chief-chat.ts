/**
 * Chief Chat orchestrator (Sprint 5.3). The conversational engine's top loop — it composes the
 * deterministic pieces and owns NO business logic:
 *
 *   message → mode → context-router (plan) → tool-loop (grounding) → reasoning → proposal → provider
 *
 * Every answer is grounded in tool results; mutations become proposals (never direct writes); the
 * provider is chosen by the Provider Policy (offline → Local). Deterministic given the injected
 * registry, policy and clock — a real provider swaps in at the reasoning step without changing the
 * loop's shape.
 */
import { selectProvider, type PolicyInputs } from "../chief";
import type { ToolRegistry } from "../tools";
import { classifyMode, MODE_CONFIG, planIntent } from "./context-router";
import { composeAnswer } from "./reasoning";
import { runToolLoop } from "./tool-loop";
import type { AssistantProposal, AssistantTurn, Conversation, ConversationMode } from "./types";

export interface RunTurnDeps {
  registry: ToolRegistry;
  policy?: PolicyInputs;
  now?: () => Date;
  newId?: () => string;
  granted?: string[];
  services?: Record<string, unknown>;
  /** Force a mode (else classified from the message). */
  mode?: ConversationMode;
}

/** Run one conversational turn. Returns the assistant turn (message + proposal + provider + grounding). */
export async function runTurn(
  _conversation: Conversation,
  userMessage: string,
  deps: RunTurnDeps,
): Promise<AssistantTurn> {
  const now = deps.now ?? (() => new Date());
  const newId = deps.newId ?? (() => `msg_${now().getTime().toString(36)}`);
  const mode = deps.mode ?? classifyMode(userMessage);
  const plan = planIntent(userMessage, mode);

  const policyInputs: PolicyInputs = deps.policy ?? { isAvailable: () => false, offline: true };
  const provider = selectProvider(MODE_CONFIG[mode].capability, policyInputs).provider;

  const loop = await runToolLoop(plan, deps.registry, {
    ...(deps.granted ? { granted: deps.granted } : {}),
    ...(deps.services ? { services: deps.services } : {}),
    now: () => now().getTime(),
  });
  const answer = composeAnswer(userMessage, plan, loop);
  const proposal = plan.mutation ? buildProposal(userMessage) : null;

  return {
    message: {
      id: newId(),
      role: "assistant",
      content: answer.text,
      toolCalls: loop.calls,
      citations: loop.citations,
      createdAt: now().toISOString(),
    },
    mode,
    provider,
    proposal,
    grounded: loop.grounded || plan.intent === "recommend" || plan.intent === "explain",
    unknown: answer.unknown,
  };
}

/** Build a proposal shell from a mutation request (the server fills the concrete planner change). */
function buildProposal(message: string): AssistantProposal {
  return {
    kind: "planner",
    summary: `Proposed change: "${message}"`,
    preview: ["This will be prepared as a planner proposal.", "Nothing changes until you accept."],
    payload: { request: message },
  };
}
