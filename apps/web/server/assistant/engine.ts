import "server-only";
import { ProviderRegistry } from "@myos/ai/providers";
import type { PolicyInputs } from "@myos/ai/chief";
import { createEnvProviders } from "./providers";

/**
 * Assistant provider registry (Sprint 5.3). One process-wide registry wired with the real,
 * env-driven cloud clients — a provider is available only when its key is set; Local is always the
 * fallback. The conversational engine reads availability from here to resolve the Provider Policy.
 */
const globalForAsst = globalThis as unknown as { __myosAssistantRegistry?: ProviderRegistry };

export function getAssistantRegistry(): ProviderRegistry {
  return (globalForAsst.__myosAssistantRegistry ??= new ProviderRegistry({
    ...createEnvProviders(),
    now: () => new Date(),
  }));
}

/** Provider Policy inputs from the live registry (availability + offline switch). */
export function assistantPolicyInputs(offline = false): PolicyInputs {
  const registry = getAssistantRegistry();
  return {
    isAvailable: (provider) => {
      try {
        return registry.get(provider as never).available;
      } catch {
        return false;
      }
    },
    budgetOk: true,
    offline,
  };
}
