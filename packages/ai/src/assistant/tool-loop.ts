/**
 * Tool Loop (Sprint 5.3, 06_AI_Architecture §5). Executes an intent plan against the 5.1 Tool
 * Registry — the ONLY way the assistant obtains facts. Every tool runs through the registry's
 * permission + validation + telemetry pipeline; the assistant never fabricates data. Returns the
 * grounding trail (tool-call records) + citations. Pure orchestration over injected collaborators.
 */
import { executeTool, type ToolRegistry } from "../tools";
import { cite, dedupeCitations, type Citation } from "./citations";
import type { IntentPlan } from "./context-router";
import type { ToolCallRecord } from "./types";

export interface ToolLoopOptions {
  granted?: string[];
  now?: () => number;
  services?: Record<string, unknown>;
}

export interface ToolLoopResult {
  calls: ToolCallRecord[];
  results: { name: string; ok: boolean; value: unknown }[];
  citations: Citation[];
  /** True if at least one tool returned real data (not "unwired"/empty). */
  grounded: boolean;
}

/** Run every tool in the plan, collecting records, results and citations. Never throws. */
export async function runToolLoop(
  plan: IntentPlan,
  registry: ToolRegistry,
  opts: ToolLoopOptions = {},
): Promise<ToolLoopResult> {
  const calls: ToolCallRecord[] = [];
  const results: { name: string; ok: boolean; value: unknown }[] = [];
  const citations: Citation[] = [];
  let grounded = false;

  for (const call of plan.tools) {
    const exec = await executeTool(registry, call.name, call.input, {
      ...(opts.granted ? { granted: opts.granted } : {}),
      ...(opts.now ? { now: opts.now } : {}),
      ctx: { services: opts.services ?? {} },
    });
    calls.push({
      tool: call.name,
      input: call.input,
      ok: exec.ok,
      resultSummary: summarize(exec.result, exec.error),
      durationMs: exec.durationMs,
    });
    results.push({ name: call.name, ok: exec.ok, value: exec.result });
    if (exec.ok && hasRealData(exec.result)) {
      grounded = true;
      citations.push(...extractCitations(call.name, exec.result));
    }
  }
  return { calls, results, citations: dedupeCitations(citations), grounded };
}

/** A one-line summary of a tool result for the grounding trail (never dumps raw private data). */
function summarize(result: unknown, error?: string): string {
  if (error) return `error: ${error}`;
  if (Array.isArray(result)) return `${result.length} result(s)`;
  if (result && typeof result === "object") {
    const keys = Object.keys(result as Record<string, unknown>);
    return keys.slice(0, 4).join(", ");
  }
  return String(result ?? "");
}

/** A tool result counts as "real data" unless it's an unwired marker or empty. */
function hasRealData(result: unknown): boolean {
  if (result == null) return false;
  if (Array.isArray(result)) return result.length > 0;
  if (typeof result === "object") {
    const obj = result as Record<string, unknown>;
    if (obj.unwired === true) return false;
    return Object.keys(obj).length > 0;
  }
  return true;
}

/** Extract citations from a tool result: entity refs, arrays of {id}, or a query marker. */
function extractCitations(tool: string, result: unknown): Citation[] {
  const out: Citation[] = [];
  const module = toolModule(tool);
  if (Array.isArray(result)) {
    for (const item of result.slice(0, 5)) {
      if (item && typeof item === "object" && "id" in item) {
        const rec = item as { id: string; title?: string; name?: string };
        out.push(cite(module, String(rec.id), rec.title ?? rec.name ?? String(rec.id)));
      }
    }
  } else if (result && typeof result === "object") {
    const rec = result as { ref?: { module: string; id: string }; id?: string; title?: string };
    if (rec.ref) out.push(cite(rec.ref.module, rec.ref.id, rec.title ?? rec.ref.id));
    else if (rec.id) out.push(cite(module, String(rec.id), rec.title ?? String(rec.id)));
  }
  return out;
}

function toolModule(tool: string): string {
  if (tool.startsWith("query_")) return tool.slice("query_".length);
  if (tool === "search_semantic") return "search";
  if (tool.startsWith("chief_")) return "chief";
  return tool;
}
