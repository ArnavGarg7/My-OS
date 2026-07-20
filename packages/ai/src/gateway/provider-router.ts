/**
 * Provider router (Sprint 5.1, 06_AI_Architecture §Capability-Based Routing). Resolves a request's
 * capability + tier to a concrete model key and its provider — deterministically. Routing order:
 * an explicit `request.model` wins; otherwise the tier's configured route for the capability;
 * otherwise the cheapest model that serves the capability; otherwise the local deterministic model.
 * Failover picks the next AVAILABLE provider's model for the same capability.
 */
import { type Capability, type Tier, TIER_ROUTES } from "../config/capabilities";
import { getModel, modelsForCapability } from "../config/models";
import type { ProviderRegistry } from "../providers/registry";
import type { AiRequest } from "../schemas";

export interface RouteResult {
  modelKey: string;
  provider: string;
}

/** Resolve the model+provider for a request under a tier. Deterministic; never throws. */
export function routeRequest(
  request: AiRequest,
  tier: Tier,
  registry: ProviderRegistry,
): RouteResult {
  const cap = request.capability as Capability;

  // 1. Explicit model.
  if (request.model && getModel(request.model)) {
    return { modelKey: request.model, provider: registry.forModel(request.model).name };
  }
  // 2. Tier route.
  const routed = TIER_ROUTES[tier][cap];
  if (routed && getModel(routed)) {
    return { modelKey: routed, provider: registry.forModel(routed).name };
  }
  // 3. Cheapest model for the capability whose provider is available.
  for (const m of modelsForCapability(cap)) {
    if (registry.get(m.provider).available) return { modelKey: m.id, provider: m.provider };
  }
  // 4. Local fallback.
  return { modelKey: "local-deterministic", provider: "local" };
}

/**
 * Failover: given the model that failed, pick the next model+provider that serves the capability
 * and whose provider is available and different from the failed provider. Returns null if none.
 */
export function failover(
  request: AiRequest,
  failedProvider: string,
  registry: ProviderRegistry,
): RouteResult | null {
  const cap = request.capability as Capability;
  for (const m of modelsForCapability(cap)) {
    if (m.provider !== failedProvider && registry.get(m.provider).available) {
      return { modelKey: m.id, provider: m.provider };
    }
  }
  // Always fall back to local if it wasn't the failed one.
  if (failedProvider !== "local") return { modelKey: "local-deterministic", provider: "local" };
  return null;
}
