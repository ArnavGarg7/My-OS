/**
 * Context Router (Sprint 5.3). Given the user's message + conversation mode, decides which tools,
 * provider capability, prompt and response mode to use — deterministically, with no provider-specific
 * logic. It classifies intent to a tool PLAN (which tools to call, and whether the request mutates
 * data → a proposal). This is the deterministic skeleton the provider's tool-calling maps onto; on
 * the Local provider the plan IS the execution. Pure.
 */
import type { PolicyCapability } from "../chief";
import type { ConversationMode } from "./types";

export interface ModeConfig {
  /** Tool names available in this mode (subset of the registry). */
  tools: string[];
  /** Provider capability to route through the Provider Policy. */
  capability: PolicyCapability;
  /** Prompt asset name (frozen, versioned — 06 §13). */
  prompt: string;
}

/** Per-mode configuration (06 §Conversation Modes). */
export const MODE_CONFIG: Record<ConversationMode, ModeConfig> = {
  chief: {
    tools: ["chief_now", "query_tasks", "query_calendar"],
    capability: "reasoning",
    prompt: "system.assistant",
  },
  planning: {
    tools: ["query_tasks", "query_calendar", "chief_optimize"],
    capability: "planning",
    prompt: "planner.generate",
  },
  review: {
    tools: ["query_tasks", "search_semantic"],
    capability: "summaries",
    prompt: "review.weekly",
  },
  research: {
    tools: ["search_semantic", "query_tasks"],
    capability: "reasoning",
    prompt: "system.assistant",
  },
  search: { tools: ["search_semantic"], capability: "fast", prompt: "system.assistant" },
  editing: {
    tools: ["query_tasks", "query_calendar"],
    capability: "reasoning",
    prompt: "system.assistant",
  },
  automation: { tools: ["query_tasks"], capability: "reasoning", prompt: "system.assistant" },
  troubleshooting: { tools: ["search_semantic"], capability: "fast", prompt: "system.assistant" },
};

/** Classify a message into a conversation mode (deterministic keyword rules). */
export function classifyMode(message: string): ConversationMode {
  const m = message.toLowerCase();
  if (/\b(move|reschedule|delay|push|skip|cancel|optimi[sz]e|plan (my|the) day)\b/.test(m))
    return "planning";
  if (/\b(review|how did|summar|recap|weekly|last week)\b/.test(m)) return "review";
  if (/\b(when did|last time|find|search|look up|show me)\b/.test(m)) return "search";
  if (/\b(research|compare|explain how|learn about)\b/.test(m)) return "research";
  if (/\bautomat|\b(rule|trigger|workflow)\b/.test(m)) return "automation";
  if (/\b(error|broken|not working|fix|debug|why (isn|not))\b/.test(m)) return "troubleshooting";
  if (/\b(edit|rename|update|change (the|my))\b/.test(m)) return "editing";
  return "chief";
}

export type IntentKind = "recommend" | "explain" | "mutate" | "lookup" | "answer";

export interface IntentPlan {
  intent: IntentKind;
  /** Ordered tool invocations to ground the answer. */
  tools: { name: string; input: Record<string, unknown> }[];
  /** True when the request would change data → produce a proposal, never a direct write. */
  mutation: boolean;
}

/** Plan the tool calls for a message within a mode. Deterministic + grounded. */
export function planIntent(message: string, mode: ConversationMode): IntentPlan {
  const m = message.toLowerCase();
  const config = MODE_CONFIG[mode];

  // Mutations → proposal (Planner/Task changes are never applied directly).
  if (
    /\b(move|reschedule|delay|push|skip|cancel|delete|clear|rename|add task|create task)\b/.test(m)
  ) {
    return { intent: "mutate", tools: [{ name: "query_calendar", input: {} }], mutation: true };
  }
  // Explainability — no tool needed beyond the current recommendation.
  if (/\b(why|reason|because|justif)\b/.test(m)) {
    return { intent: "explain", tools: [{ name: "chief_now", input: {} }], mutation: false };
  }
  // "what should I do / now" → recommendation.
  if (/\b(what should i|what do i|right now|next|focus on)\b/.test(m)) {
    return { intent: "recommend", tools: [{ name: "chief_now", input: {} }], mutation: false };
  }
  // Lookups — ground in search/timeline/tasks.
  if (/\b(when did|last time|find|search|show me|how many|list)\b/.test(m)) {
    return {
      intent: "lookup",
      tools: [{ name: "search_semantic", input: { query: message } }],
      mutation: false,
    };
  }
  // Default: answer, grounded by the mode's primary tool.
  const first = config.tools[0] ?? "search_semantic";
  const input = first === "search_semantic" ? { query: message } : {};
  return { intent: "answer", tools: [{ name: first, input }], mutation: false };
}
