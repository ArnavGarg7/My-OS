/**
 * AI Observability (Sprint 5.4, 06_AI_Architecture §Observability). Every AI request produces a
 * complete, replayable execution trace: which provider handled it, which prompt version, which
 * context builders and tools ran, memory retrieval, per-stage latencies, token counts, and any
 * fallback events. Traces answer "why did this happen?" and support deterministic replay for
 * debugging. Pure — the server records real traces; this module only shapes, summarizes and
 * replays them.
 */

/** One tool invocation as recorded in a trace. */
export interface TraceToolCall {
  tool: string;
  input: Record<string, unknown>;
  ok: boolean;
  durationMs: number;
  resultSummary: string;
}

/** A provider fallback hop (the policy skipped one provider for another). */
export interface TraceFallback {
  from: string;
  to: string;
  reason: string;
}

/** Per-stage latency breakdown (ms). Total is authoritative; stages need not sum exactly. */
export interface TraceLatencies {
  contextMs: number;
  memoryMs: number;
  toolMs: number;
  providerMs: number;
  totalMs: number;
}

/** A complete execution trace for one AI request. */
export interface ExecutionTrace {
  traceId: string;
  conversationId: string | null;
  feature: string;
  provider: string;
  promptVersion: string | null;
  /** Context builders that contributed, in order. */
  contextBuilders: string[];
  toolCalls: TraceToolCall[];
  /** Memory ids retrieved for grounding. */
  memoryRetrieved: string[];
  latencies: TraceLatencies;
  inputTokens: number;
  outputTokens: number;
  fallbacks: TraceFallback[];
  status: "ok" | "error" | "refusal";
  /** True when the answer was grounded in ≥1 tool result. */
  grounded: boolean;
  createdAt: string;
}

/** The loosely-typed inputs the server collects for a request. */
export interface TraceInput {
  traceId: string;
  feature: string;
  provider: string;
  conversationId?: string | null;
  promptVersion?: string | null;
  contextBuilders?: string[];
  toolCalls?: TraceToolCall[];
  memoryRetrieved?: string[];
  latencies?: Partial<TraceLatencies>;
  inputTokens?: number;
  outputTokens?: number;
  fallbacks?: TraceFallback[];
  status?: "ok" | "error" | "refusal";
  grounded?: boolean;
  createdAt?: string;
}

/** Normalize collected request data into a complete, well-formed trace. Deterministic. */
export function buildTrace(input: TraceInput): ExecutionTrace {
  const toolCalls = input.toolCalls ?? [];
  const toolMs = input.latencies?.toolMs ?? toolCalls.reduce((s, t) => s + t.durationMs, 0);
  const latencies: TraceLatencies = {
    contextMs: input.latencies?.contextMs ?? 0,
    memoryMs: input.latencies?.memoryMs ?? 0,
    toolMs,
    providerMs: input.latencies?.providerMs ?? 0,
    totalMs: input.latencies?.totalMs ?? 0,
  };
  return {
    traceId: input.traceId,
    conversationId: input.conversationId ?? null,
    feature: input.feature,
    provider: input.provider,
    promptVersion: input.promptVersion ?? null,
    contextBuilders: input.contextBuilders ?? [],
    toolCalls,
    memoryRetrieved: input.memoryRetrieved ?? [],
    latencies,
    inputTokens: input.inputTokens ?? 0,
    outputTokens: input.outputTokens ?? 0,
    fallbacks: input.fallbacks ?? [],
    status: input.status ?? "ok",
    grounded: input.grounded ?? toolCalls.some((t) => t.ok),
    createdAt: input.createdAt ?? "1970-01-01T00:00:00.000Z",
  };
}

/** A compact, human-facing summary of a trace. */
export interface TraceSummary {
  traceId: string;
  provider: string;
  toolCount: number;
  failedTools: number;
  totalMs: number;
  tokens: number;
  fallbackCount: number;
  grounded: boolean;
  status: string;
}

/** Summarize a trace for a list view. */
export function summarizeTrace(t: ExecutionTrace): TraceSummary {
  return {
    traceId: t.traceId,
    provider: t.provider,
    toolCount: t.toolCalls.length,
    failedTools: t.toolCalls.filter((c) => !c.ok).length,
    totalMs: t.latencies.totalMs,
    tokens: t.inputTokens + t.outputTokens,
    fallbackCount: t.fallbacks.length,
    grounded: t.grounded,
    status: t.status,
  };
}

/** The outcome of replaying a trace: the same structural facts, recomputed from recorded inputs. */
export interface ReplayResult {
  traceId: string;
  reproducible: boolean;
  /** Which recorded facts were re-derived identically. */
  checks: { label: string; ok: boolean }[];
  toolSequence: string[];
}

/**
 * Replay a trace deterministically: re-derive its structural facts from the recorded steps and
 * confirm they match. A trace is reproducible when its tool sequence, grounding flag and status are
 * internally consistent (a real re-execution against the Local provider would yield the same shape).
 */
export function replayTrace(t: ExecutionTrace): ReplayResult {
  const toolSequence = t.toolCalls.map((c) => c.tool);
  const derivedGrounded = t.toolCalls.some((c) => c.ok);
  const derivedToolMs = t.toolCalls.reduce((s, c) => s + c.durationMs, 0);
  const checks = [
    { label: "grounding matches tool results", ok: derivedGrounded === t.grounded },
    {
      label: "tool time accounted",
      ok: derivedToolMs <= t.latencies.totalMs || t.latencies.totalMs === 0,
    },
    {
      label: "status consistent with tools",
      ok:
        t.status !== "ok" ||
        !t.toolCalls.some((c) => !c.ok) ||
        t.toolCalls.length === 0 ||
        derivedGrounded,
    },
    { label: "provider recorded", ok: t.provider.length > 0 },
  ];
  return {
    traceId: t.traceId,
    reproducible: checks.every((c) => c.ok),
    checks,
    toolSequence,
  };
}
