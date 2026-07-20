/**
 * Conversational Chief of Staff types (Sprint 5.3). The assistant is the conversational interface
 * to My OS — NOT ChatGPT. Every answer is built from deterministic tool results retrieved through
 * the 5.1 Tool Registry; if the OS doesn't know something, the Chief says so. The AI reasons; the
 * operating system owns the truth. These types are pure — no IO, no provider coupling.
 */
import type { Citation } from "./citations";

/** A message in a conversation. Roles mirror the provider contract. */
export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  /** Tool calls the assistant made this turn (grounding trail). */
  toolCalls?: ToolCallRecord[];
  /** Citations backing factual claims (06_AI_Architecture §5). */
  citations?: Citation[];
  createdAt: string;
}

/** A record of one tool invocation during a turn. */
export interface ToolCallRecord {
  tool: string;
  input: Record<string, unknown>;
  ok: boolean;
  /** Compact result summary (never raw private data in transit). */
  resultSummary: string;
  durationMs: number;
}

/** The conversation modes (06 §Conversation Modes) — each isolates prompt, tools, provider, context. */
export type ConversationMode =
  | "chief"
  | "planning"
  | "review"
  | "research"
  | "search"
  | "editing"
  | "automation"
  | "troubleshooting";

/** A proposed mutation — every data change is a proposal until the user accepts (never a direct write). */
export interface AssistantProposal {
  kind: "planner" | "task" | "reschedule" | "note" | "automation";
  summary: string;
  /** Human-readable preview lines. */
  preview: string[];
  /** The concrete change payload the server would apply on accept. */
  payload: Record<string, unknown>;
}

/** The result of one assistant turn. Deterministic given the conversation + tool results. */
export interface AssistantTurn {
  message: ConversationMessage;
  mode: ConversationMode;
  /** Provider that served the reasoning (from the Provider Policy). */
  provider: string;
  /** A proposal, when the user asked to change data. */
  proposal: AssistantProposal | null;
  /** Whether the answer is grounded (backed by ≥1 tool result). */
  grounded: boolean;
  /** True when the OS genuinely doesn't have the answer. */
  unknown: boolean;
}

/** A conversation — persisted history + a rolling summary to keep context small. */
export interface Conversation {
  id: string;
  title: string;
  mode: ConversationMode;
  messages: ConversationMessage[];
  /** Rolling summary of older turns (06 §Multi-Turn). */
  summary: string;
  createdAt: string;
  updatedAt: string;
}
