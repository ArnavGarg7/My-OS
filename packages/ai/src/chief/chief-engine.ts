/**
 * Chief Engine (Sprint 5.2) — the ORCHESTRATOR. It never computes business logic; it composes the
 * deterministic Now/Morning/Notification engines and resolves a provider via the Provider Policy,
 * producing one grounded response. The pipeline mirrors 06_AI_Architecture §3:
 *
 *   ChiefContext → Now Engine → Notifications → Provider Policy → Chief response
 *
 * A provider (chosen by policy) may later rephrase the copy; the recommendation, confidence and
 * explanation are all deterministic and reproducible. Offline resolves to the Local provider.
 */
import { morningIntelligence } from "./morning";
import { chiefNotifications } from "./notifications";
import {
  selectProvider,
  type PolicyCapability,
  type PolicyDecision,
  type PolicyInputs,
} from "./provider-policy";
import { nowRecommendation } from "./recommendation";
import type { ChiefContext, ChiefNotification, MorningIntelligence, Recommendation } from "./types";

export interface ChiefResponse {
  recommendation: Recommendation;
  notifications: ChiefNotification[];
  /** The provider the policy selected for the reasoning capability. */
  provider: PolicyDecision;
}

export interface ChiefEngineOptions {
  /** Provider availability + budget, for policy resolution. Defaults to offline (local). */
  policy?: PolicyInputs;
  /** Capability to route the Chief's reasoning through (default "reasoning"). */
  capability?: PolicyCapability;
}

/** Run the Chief for the current moment. Deterministic given context + policy inputs. */
export function runChief(ctx: ChiefContext, opts: ChiefEngineOptions = {}): ChiefResponse {
  const policyInputs: PolicyInputs = opts.policy ?? { isAvailable: () => false, offline: true };
  const provider = selectProvider(opts.capability ?? "reasoning", policyInputs);
  return {
    recommendation: nowRecommendation(ctx),
    notifications: chiefNotifications(ctx),
    provider,
  };
}

/** Run the morning flow (Morning Intelligence + notifications + provider selection). */
export function runMorning(
  ctx: ChiefContext,
  opts: ChiefEngineOptions = {},
): { morning: MorningIntelligence; notifications: ChiefNotification[]; provider: PolicyDecision } {
  const policyInputs: PolicyInputs = opts.policy ?? { isAvailable: () => false, offline: true };
  return {
    morning: morningIntelligence(ctx),
    notifications: chiefNotifications(ctx),
    provider: selectProvider("planning", policyInputs),
  };
}
