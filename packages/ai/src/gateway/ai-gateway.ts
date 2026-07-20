/**
 * AI Gateway (Sprint 5.1) — the SINGLE entry point for every AI request (06_AI_Architecture §3).
 * No module talks to a provider directly; everything flows Application → Gateway → route → budget
 * → provider (with retry + failover) → structured validation → telemetry. The gateway owns
 * retries, failover, cost accounting and normalization; it delegates the actual model call to the
 * provider registry and the actual side effects (waiting, recording) to injected collaborators, so
 * the orchestration itself is deterministic and testable.
 */
import { type Tier } from "../config/capabilities";
import { computeCost, roundUsd, type BudgetVerdict } from "../config/costs";
import type { ProviderRegistry } from "../providers/registry";
import type { AiRequest, AiResponse, TelemetryEvent } from "../schemas";
import { buildProviderInput, normalizeRequest } from "./request";
import { normalizeResponse } from "./response";
import { failover, routeRequest } from "./provider-router";
import { decideRetry } from "./retry";

/** Raised when the hard budget cap is hit (06_AI_Architecture §14 → FR-AI-7). */
export class BudgetExceededError extends Error {
  code = "AI_BUDGET_EXCEEDED" as const;
  constructor() {
    super("AI budget exceeded — requests are paused for today.");
    this.name = "BudgetExceededError";
  }
}

/** Structured validator hook: parse+repair provider text against a named schema. */
export type StructuredValidator = (
  text: string,
  schemaName: string,
) => { ok: boolean; parsed: unknown; repairCount: number };

export interface GatewayRunOptions {
  /** Consulted before spending; a "hard_exceeded" verdict aborts with BudgetExceededError. */
  budgetCheck?: (estimatedUsd: number) => BudgetVerdict;
  /** Sink for the telemetry event produced by this call. */
  recordTelemetry?: (event: TelemetryEvent) => void;
  /** Validate + repair structured output when the request declares a schema. */
  structured?: StructuredValidator;
  /** Prompt version for telemetry (06_AI_Architecture §Telemetry). */
  promptVersion?: string | null;
}

export interface GatewayConfig {
  registry: ProviderRegistry;
  tier: Tier;
  now?: (() => Date) | undefined;
  /** Injected wait for retry backoff (real setTimeout in server; instant in tests). */
  sleep?: ((ms: number) => Promise<void>) | undefined;
}

export class AiGateway {
  private readonly now: () => Date;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly config: GatewayConfig) {
    this.now = config.now ?? (() => new Date());
    this.sleep = config.sleep ?? (async () => {});
  }

  /** Run one request through the full pipeline. Returns the normalized response. */
  async run(raw: unknown, opts: GatewayRunOptions = {}): Promise<AiResponse> {
    const startedAt = this.now().getTime();
    const request = normalizeRequest(raw);
    const requestId = request.requestId ?? `air_${startedAt.toString(36)}`;

    let route = routeRequest(request, this.config.tier, this.config.registry);

    // Budget guard (estimate before spending).
    const estInput = buildProviderInput(request, route.modelKey);
    const estUsd = computeCost(
      route.modelKey,
      estInput.messages.reduce((s, m) => s + Math.ceil(m.content.length / 4), 0),
      estInput.maxOutputTokens,
    );
    if (opts.budgetCheck && opts.budgetCheck(estUsd) === "hard_exceeded") {
      throw new BudgetExceededError();
    }

    let retries = 0;
    let attempt = 0;
    let failedOver = false;
    // Retry + failover loop.
    for (;;) {
      const provider = this.config.registry.get(this.config.registry.forModel(route.modelKey).name);
      const providerInput = buildProviderInput(request, route.modelKey);
      try {
        const result = await provider.generate(providerInput);
        return this.finish(request, route, result, {
          requestId,
          retries,
          startedAt,
          opts,
          status: result.finishReason === "refusal" ? "refusal" : "ok",
        });
      } catch (err) {
        const decision = decideRetry(err, attempt);
        if (decision.retry) {
          retries += 1;
          attempt += 1;
          await this.sleep(decision.delayMs);
          continue;
        }
        // Not retryable — try one failover to a different provider, else record + rethrow.
        if (!failedOver) {
          const next = failover(request, route.provider, this.config.registry);
          if (next) {
            failedOver = true;
            route = next;
            attempt = 0;
            continue;
          }
        }
        this.recordError(request, route, { requestId, retries, startedAt, opts });
        throw err;
      }
    }
  }

  private finish(
    request: AiRequest,
    route: { modelKey: string; provider: string },
    result: { text: string; finishReason: AiResponse["finishReason"]; usage: AiResponse["usage"] },
    ctx: {
      requestId: string;
      retries: number;
      startedAt: number;
      opts: GatewayRunOptions;
      status: TelemetryEvent["status"];
    },
  ): AiResponse {
    let parsed: unknown;
    let repairCount = 0;
    let status = ctx.status;
    if (request.structuredSchema && ctx.opts.structured) {
      const v = ctx.opts.structured(result.text, request.structuredSchema);
      parsed = v.parsed;
      repairCount = v.repairCount;
      if (!v.ok) status = "error";
    }
    const response = normalizeResponse(result, route.modelKey, route.provider, parsed);
    this.emit(request, route, response.usage, {
      ...ctx,
      repairCount,
      status,
    });
    return response;
  }

  private recordError(
    request: AiRequest,
    route: { modelKey: string; provider: string },
    ctx: { requestId: string; retries: number; startedAt: number; opts: GatewayRunOptions },
  ): void {
    this.emit(
      request,
      route,
      { inputTokens: 0, outputTokens: 0, cachedTokens: 0 },
      {
        ...ctx,
        repairCount: 0,
        status: "error",
      },
    );
  }

  private emit(
    request: AiRequest,
    route: { modelKey: string; provider: string },
    usage: AiResponse["usage"],
    ctx: {
      requestId: string;
      retries: number;
      startedAt: number;
      opts: GatewayRunOptions;
      repairCount: number;
      status: TelemetryEvent["status"];
    },
  ): void {
    if (!ctx.opts.recordTelemetry) return;
    ctx.opts.recordTelemetry({
      requestId: ctx.requestId,
      feature: request.feature,
      provider: route.provider,
      model: route.modelKey,
      promptVersion: ctx.opts.promptVersion ?? null,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cachedTokens: usage.cachedTokens,
      latencyMs: Math.max(0, this.now().getTime() - ctx.startedAt),
      retries: ctx.retries,
      repairCount: ctx.repairCount,
      toolCalls: 0,
      toolTimeMs: 0,
      costUsd: roundUsd(computeCost(route.modelKey, usage.inputTokens, usage.outputTokens)),
      status: ctx.status,
    });
  }
}
