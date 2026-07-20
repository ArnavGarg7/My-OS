/**
 * Tool executor (Sprint 5.1, 06_AI_Architecture §Tool Registry). The single execution pipeline:
 * registry lookup → permission check → input validation → execute → structured result. No tool
 * runs any other way. Time is injected; the executor measures wall time via an injected clock.
 */
import { checkPermissions } from "./permissions";
import type { ToolContext, ToolRegistry } from "./registry";
import { validateToolInput } from "./validation";

export interface ToolExecutionResult {
  ok: boolean;
  tool: string;
  result?: unknown;
  error?: string;
  /** Failure stage, for telemetry. */
  stage?: "not_found" | "permission" | "validation" | "execution";
  durationMs: number;
}

export interface ExecuteOptions {
  granted?: string[];
  ctx?: Partial<ToolContext>;
  now?: () => number;
}

/** Run a tool through the full pipeline. Never throws — failures come back as structured results. */
export async function executeTool(
  registry: ToolRegistry,
  name: string,
  input: Record<string, unknown>,
  opts: ExecuteOptions = {},
): Promise<ToolExecutionResult> {
  const now = opts.now ?? (() => Date.now());
  const start = now();
  const done = (
    partial: Omit<ToolExecutionResult, "tool" | "durationMs">,
  ): ToolExecutionResult => ({
    tool: name,
    durationMs: Math.max(0, now() - start),
    ...partial,
  });

  const plugin = registry.get(name);
  if (!plugin) return done({ ok: false, error: `unknown tool: ${name}`, stage: "not_found" });

  const perm = checkPermissions(plugin.definition, opts.granted ?? []);
  if (!perm.allowed)
    return done({
      ok: false,
      error: `missing permissions: ${perm.missing.join(", ")}`,
      stage: "permission",
    });

  const validation = validateToolInput(plugin.definition, input);
  if (!validation.ok)
    return done({ ok: false, error: validation.errors.join("; "), stage: "validation" });

  try {
    const ctx: ToolContext = { now: new Date(now()), ...opts.ctx };
    const result = await plugin.execute(input, ctx);
    return done({ ok: true, result });
  } catch (err) {
    return done({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      stage: "execution",
    });
  }
}
