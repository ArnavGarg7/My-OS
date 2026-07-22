import { describe, expect, it } from "vitest";
import {
  CONNECTOR_PROVIDERS,
  getProvider,
  providersByCategory,
  canTransition,
  transition,
  isConnected,
  normalize,
  normalizedKinds,
  planSync,
  resolveSync,
  computeHealth,
  healthBand,
  backoffMs,
  type RawPayload,
} from "./index";
import { generateSignal } from "../events/generator";

/**
 * Connector Platform (Sprint 6.4). Provider-agnostic, deterministic: external raw payloads → the
 * SAME normalized DomainEvent the internal engine uses → signals. Connectors never interpret. No AI,
 * no IO. All time injected.
 */

let n = 0;
const newId = () => `c${(n += 1)}`;
const now = new Date("2026-07-20T10:00:00.000Z");
const deps = { newId, now };

describe("registry — discoverable, read-first providers", () => {
  it("registers the Sprint 6.4 providers, all read-only", () => {
    expect(CONNECTOR_PROVIDERS.length).toBeGreaterThanOrEqual(6);
    expect(CONNECTOR_PROVIDERS.every((p) => p.readOnly)).toBe(true);
    expect(getProvider("github")?.supportedEvents).toContain("github.ci_failed");
    expect(providersByCategory("calendar").length).toBeGreaterThan(0);
  });
});

describe("lifecycle — explicit transitions only", () => {
  it("allows legal transitions and throws on illegal ones", () => {
    expect(canTransition("disconnected", "authenticating")).toBe(true);
    expect(canTransition("disconnected", "syncing")).toBe(false);
    expect(() => transition("healthy", "authenticating")).toThrow();
    expect(isConnected("healthy")).toBe(true);
    expect(isConnected("disconnected")).toBe(false);
  });
});

describe("normalization — provider vocab → normalized kind", () => {
  it("normalizes Google + Outlook cancellations to the SAME kind", () => {
    const g = normalize(
      "google-calendar",
      {
        type: "event.cancelled",
        externalId: "e1",
        at: now.toISOString(),
        fields: { minutes: 90, label: "Standup" },
      },
      deps,
    );
    const o = normalize(
      "google-calendar",
      { type: "appointment.removed", externalId: "e2", at: now.toISOString(), fields: {} },
      deps,
    );
    expect(g?.kind).toBe("calendar.meeting_cancelled");
    expect(o?.kind).toBe("calendar.meeting_cancelled");
    expect(g?.source).toBe("calendar");
    expect(g?.ref?.module).toBe("connector");
  });
  it("maps github + external providers to `external` source; unknown → null", () => {
    const pr = normalize(
      "github",
      { type: "pull_request.merged", externalId: "pr1", at: now.toISOString(), fields: {} },
      deps,
    );
    expect(pr?.kind).toBe("github.pr_merged");
    expect(pr?.source).toBe("external");
    expect(
      normalize(
        "github",
        { type: "unknown.thing", externalId: "x", at: now.toISOString(), fields: {} },
        deps,
      ),
    ).toBeNull();
    expect(normalizedKinds("weather")).toContain("weather.rain_forecast");
  });
});

describe("sync + conflict resolution — deterministic, dedup, no-op", () => {
  const raws: RawPayload[] = [
    { type: "pull_request.merged", externalId: "pr1", at: "2026-07-20T09:00:00.000Z", fields: {} },
    { type: "pull_request.merged", externalId: "pr1", at: "2026-07-20T09:00:00.000Z", fields: {} }, // dup
    {
      type: "check_run.failed",
      externalId: "ci1",
      at: "2026-07-20T09:30:00.000Z",
      fields: { label: "build" },
    },
  ];
  it("plans incremental vs full sync from a checkpoint", () => {
    expect(planSync("a1", null, "manual").mode).toBe("full");
    expect(planSync("a1", "2026-07-20T08:00:00.000Z", "webhook").mode).toBe("incremental");
  });
  it("dedupes, normalizes, and advances the checkpoint", () => {
    const res = resolveSync("github", raws, deps, null);
    expect(res.events.length).toBe(2); // dup dropped
    expect(res.dropped).toBe(1);
    expect(res.checkpoint).toBe("2026-07-20T09:30:00.000Z"); // latest payload time
  });
});

describe("normalized external events flow into the SAME signal engine", () => {
  it("a normalized github.ci_failed produces a risk signal", () => {
    const ev = normalize(
      "github",
      {
        type: "check_run.failed",
        externalId: "ci1",
        at: now.toISOString(),
        fields: { label: "build" },
      },
      deps,
    )!;
    const signal = generateSignal(ev, deps);
    expect(signal?.category).toBe("risks");
    expect(signal?.explanation.headline).toBe("CI is failing");
  });
  it("a normalized weather.rain_forecast produces an environment signal", () => {
    const ev = normalize(
      "weather",
      {
        type: "forecast.rain",
        externalId: "w1",
        at: now.toISOString(),
        fields: { when: "tomorrow" },
      },
      deps,
    )!;
    expect(generateSignal(ev, deps)?.category).toBe("environment");
  });
});

describe("health + retry", () => {
  it("scores health deterministically and bands it", () => {
    const good = computeHealth({
      accountId: "a1",
      state: "healthy",
      latencyMs: 200,
      syncAgeMinutes: 5,
      failures: 0,
      rateLimited: false,
      lastEventAt: null,
    });
    expect(good.score).toBe(100);
    expect(healthBand(good.score)).toBe("healthy");
    const bad = computeHealth({
      accountId: "a1",
      state: "warning",
      latencyMs: 3000,
      syncAgeMinutes: 180,
      failures: 2,
      rateLimited: true,
      lastEventAt: null,
    });
    expect(bad.score).toBeLessThan(70);
    expect(bad.reasons.length).toBeGreaterThan(1);
  });
  it("backs off exponentially with a cap", () => {
    expect(backoffMs(1)).toBe(1000);
    expect(backoffMs(3)).toBe(4000);
    expect(backoffMs(20)).toBe(60_000);
  });
});
