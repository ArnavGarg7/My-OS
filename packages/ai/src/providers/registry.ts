/**
 * Provider registry (Sprint 5.1). Holds one instance per provider name and resolves the provider
 * for a given model. The Local provider is always registered; cloud providers register whether or
 * not they have a client (an unconfigured provider is `available: false`, which the router and
 * failover logic consult). Pure container — no IO.
 */
import type { ProviderName } from "../config/models";
import { getModel } from "../config/models";
import { LocalProvider } from "./local";
import { createAnthropicProvider } from "./anthropic";
import { createOpenAiProvider } from "./openai";
import { createGeminiProvider } from "./gemini";
import { createGroqProvider } from "./groq";
import type { CloudClient } from "./cloud";
import type { Provider } from "./types";

export interface RegistryClients {
  anthropic?: CloudClient | null | undefined;
  openai?: CloudClient | null | undefined;
  gemini?: CloudClient | null | undefined;
  groq?: CloudClient | null | undefined;
  now?: (() => Date) | undefined;
}

export class ProviderRegistry {
  private readonly providers: Map<ProviderName, Provider>;

  constructor(clients: RegistryClients = {}) {
    this.providers = new Map<ProviderName, Provider>([
      ["local", new LocalProvider({ now: clients.now })],
      ["anthropic", createAnthropicProvider(clients.anthropic ?? null, clients.now)],
      ["openai", createOpenAiProvider(clients.openai ?? null, clients.now)],
      ["gemini", createGeminiProvider(clients.gemini ?? null, clients.now)],
      ["groq", createGroqProvider(clients.groq ?? null, clients.now)],
    ]);
  }

  get(name: ProviderName): Provider {
    const p = this.providers.get(name);
    if (!p) throw new Error(`Unknown provider: ${name}`);
    return p;
  }

  /** Resolve the provider that serves a model key; falls back to local for unknown models. */
  forModel(modelKey: string): Provider {
    const model = getModel(modelKey);
    return this.get(model?.provider ?? "local");
  }

  all(): Provider[] {
    return [...this.providers.values()];
  }

  /** Health-check every provider. */
  async healthAll() {
    return Promise.all(this.all().map((p) => p.healthCheck()));
  }
}
