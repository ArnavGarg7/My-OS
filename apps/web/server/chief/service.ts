import "server-only";
import type { Database } from "@myos/db";
import {
  buildNightPlan,
  clampProfile,
  defaultProfile,
  optimizePlan,
  refineProfile,
  rescuePlan,
  runChief,
  runMorning,
  summarizeFeedback,
  type Disruption,
  type Feedback,
  type PersonalProfile,
  type PolicyInputs,
} from "@myos/ai/chief";
import { stableHash, stableStringify } from "@myos/ai";
import { getAiEngine } from "../ai/engine";
import { composeChiefContext } from "./composer";
import {
  loadFeedback,
  loadProfile,
  recordFeedback,
  recordSession,
  saveProfile,
} from "./repository";

/**
 * Chief service (Sprint 5.2). Orchestrates: compose the ChiefContext from read models → run the
 * deterministic Chief core → resolve a provider via the Provider Policy (availability from the 5.1
 * engine) → persist the interaction → log telemetry through the 5.1 pipeline. It owns no business
 * logic. Provider availability comes from the 5.1 registry, so with no cloud clients everything
 * resolves to Local (offline-complete).
 */

/** Build the Provider Policy inputs from the live 5.1 engine (availability + budget). */
function policyInputs(offline = false): PolicyInputs {
  const engine = getAiEngine();
  return {
    isAvailable: (provider) => {
      try {
        return engine.registry.get(provider as never).available;
      } catch {
        return false;
      }
    },
    budgetOk: true,
    offline,
  };
}

/** Log a Chief interaction through the 5.1 telemetry collector. */
function logInteraction(feature: string, provider: string): void {
  getAiEngine().telemetry.record({
    requestId: `chief_${Date.now().toString(36)}`,
    feature,
    provider,
    model: provider === "local" ? "local-deterministic" : provider,
    promptVersion: "system.assistant@1",
    inputTokens: 0,
    outputTokens: 0,
    cachedTokens: 0,
    latencyMs: 0,
    retries: 0,
    repairCount: 0,
    toolCalls: 0,
    toolTimeMs: 0,
    costUsd: 0,
    status: "ok",
  });
}

/** chief.now — the Now Engine. Compose → recommend → persist → log. */
export async function now(db: Database, tz: string, greetingName: string) {
  const ctx = await composeChiefContext(db, tz, greetingName);
  const result = runChief(ctx, { policy: policyInputs() });
  const persisted = await recordSession(db, {
    kind: "now",
    contextHash: stableHash(stableStringify(ctx)),
    provider: result.provider.provider,
    capability: "reasoning",
    recommendation: result.recommendation,
  }).catch(() => ({ sessionId: "", recommendationId: "" }));
  logInteraction("chief.now", result.provider.provider);
  return {
    recommendation: result.recommendation,
    notifications: result.notifications,
    provider: result.provider,
    recommendationId: persisted.recommendationId,
    context: {
      readiness: ctx.readiness,
      energy: ctx.energy,
      focusWindows: ctx.focusWindows,
      mission: ctx.mission,
    },
  };
}

/** chief.morning — Morning Intelligence. */
export async function morning(db: Database, tz: string, greetingName: string) {
  const ctx = await composeChiefContext(db, tz, greetingName);
  const result = runMorning(ctx, { policy: policyInputs() });
  logInteraction("chief.morning", result.provider.provider);
  return { ...result };
}

/** chief.optimize — a planner proposal (never applied). */
export async function optimize(db: Database, tz: string, greetingName: string) {
  const ctx = await composeChiefContext(db, tz, greetingName);
  logInteraction("chief.optimize", "local");
  return optimizePlan(ctx);
}

/** chief.rescue — a rescue proposal from the given (or detected) disruptions. */
export async function rescue(
  db: Database,
  tz: string,
  greetingName: string,
  disruptions: Disruption[],
) {
  const ctx = await composeChiefContext(db, tz, greetingName);
  ctx.disruptions = disruptions;
  logInteraction("chief.rescue", "local");
  return rescuePlan(ctx);
}

/** chief.night — the Night Planning flow. */
export async function night(db: Database, tz: string, greetingName: string) {
  const ctx = await composeChiefContext(db, tz, greetingName);
  logInteraction("chief.night", "local");
  return buildNightPlan(ctx);
}

/** chief.feedback — record feedback, refine the Personal Profile from accepted signals. */
export async function feedback(db: Database, fb: Feedback) {
  await recordFeedback(db, fb);
  const all = await loadFeedback(db);
  const profile = (await loadProfile(db)) ?? defaultProfile();
  const refined = refineProfile(profile, all);
  if (refined.revision !== profile.revision) await saveProfile(db, refined);
  return { summary: summarizeFeedback(all), profile: refined };
}

/** chief.profile.get — the Personal AI Profile (defaults if unset). */
export async function getProfile(db: Database): Promise<PersonalProfile> {
  return (await loadProfile(db)) ?? defaultProfile();
}

/** chief.profile.update — save a user-edited profile (clamped). */
export async function updateProfile(
  db: Database,
  profile: PersonalProfile,
): Promise<PersonalProfile> {
  const clamped = clampProfile(profile);
  await saveProfile(db, clamped);
  return clamped;
}
