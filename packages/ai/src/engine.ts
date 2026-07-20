/**
 * AI platform composition root (Sprint 5.1). Wires the provider registry, gateway, tool registry
 * and telemetry collector into one `AiEngine` — the object the server holds. Constructing an engine
 * with no cloud clients yields a fully-functional, deterministic, offline platform (local tier);
 * the server passes real clients + tier from env to go live in a later sprint.
 *
 * The engine performs NO business logic — it only composes the platform primitives.
 */
import type { Tier } from "./config/capabilities";
import { DEFAULTS } from "./config/defaults";
import { AiGateway, type GatewayRunOptions } from "./gateway";
import { ProviderRegistry, type RegistryClients } from "./providers";
import { BUILTIN_TOOLS, ToolRegistry } from "./tools";
import { TelemetryCollector } from "./telemetry";
import type { AiResponse } from "./schemas";

export interface AiEngineConfig {
  tier?: Tier;
  clients?: RegistryClients;
  now?: () => Date;
  sleep?: (ms: number) => Promise<void>;
}

export class AiEngine {
  readonly registry: ProviderRegistry;
  readonly gateway: AiGateway;
  readonly tools: ToolRegistry;
  readonly telemetry: TelemetryCollector;
  readonly tier: Tier;

  constructor(config: AiEngineConfig = {}) {
    this.tier = config.tier ?? DEFAULTS.defaultTier;
    this.registry = new ProviderRegistry({ ...config.clients, now: config.now });
    this.gateway = new AiGateway({
      registry: this.registry,
      tier: this.tier,
      now: config.now,
      sleep: config.sleep,
    });
    this.telemetry = new TelemetryCollector();
    this.tools = new ToolRegistry();
    for (const t of BUILTIN_TOOLS) this.tools.register(t);
  }

  /** Run a request through the gateway, recording telemetry into the collector by default. */
  run(raw: unknown, opts: GatewayRunOptions = {}): Promise<AiResponse> {
    return this.gateway.run(raw, {
      recordTelemetry: (e) => this.telemetry.record(e),
      ...opts,
    });
  }

  /** Health-check every provider. */
  health() {
    return this.registry.healthAll();
  }
}

/** Convenience factory. */
export function createAiEngine(config?: AiEngineConfig): AiEngine {
  return new AiEngine(config);
}
