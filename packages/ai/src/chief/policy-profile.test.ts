import { describe, expect, it } from "vitest";
import { selectProvider, PROVIDER_POLICIES } from "./provider-policy";
import { defaultProfile, refineProfile, clampProfile } from "./profile";
import { summarizeFeedback, deriveSteering } from "./feedback";
import { chiefNotifications } from "./notifications";
import { runChief, runMorning } from "./chief-engine";
import { makeContext } from "./fixtures";
import type { Feedback } from "./types";

describe("provider policy", () => {
  it("prefers the top available provider for a capability", () => {
    const d = selectProvider("reasoning", { isAvailable: (p) => p === "anthropic" });
    expect(d.provider).toBe("anthropic");
    expect(d.reason).toBe("preferred");
  });
  it("falls through to the next available, recording skips", () => {
    const d = selectProvider("reasoning", { isAvailable: (p) => p === "gemini" });
    expect(d.provider).toBe("gemini");
    expect(d.skipped).toContain("anthropic");
    expect(d.reason).toBe("fallback");
  });
  it("falls back to local when nothing cloud is available", () => {
    expect(selectProvider("reasoning", { isAvailable: () => false }).provider).toBe("local");
  });
  it("forces local when offline", () => {
    const d = selectProvider("planning", { isAvailable: () => true, offline: true });
    expect(d.provider).toBe("local");
    expect(d.reason).toBe("offline");
  });
  it("only allows local when the budget is exhausted", () => {
    expect(selectProvider("fast", { isAvailable: () => true, budgetOk: false }).provider).toBe(
      "local",
    );
  });
  it("every policy list terminates in local", () => {
    for (const order of Object.values(PROVIDER_POLICIES))
      expect(order[order.length - 1]).toBe("local");
  });
});

describe("personal profile", () => {
  it("only refines from accepted/modified feedback (not rejects/ignores)", () => {
    const p = defaultProfile();
    const rejected: Feedback[] = [{ recommendationId: "r", outcome: "rejected", note: "later" }];
    expect(refineProfile(p, rejected)).toEqual(p);
    const accepted: Feedback[] = [
      { recommendationId: "r", outcome: "accepted", note: "start later" },
    ];
    const next = refineProfile(p, accepted);
    expect(next.revision).toBe(1);
    expect(next.deepWorkPreferredStartHour).toBe(p.deepWorkPreferredStartHour + 1);
  });
  it("clamps user edits to safe ranges", () => {
    const p = clampProfile({
      ...defaultProfile(),
      deepWorkPreferredStartHour: 99,
      breakFrequencyMinutes: 5,
    });
    expect(p.deepWorkPreferredStartHour).toBe(23);
    expect(p.breakFrequencyMinutes).toBe(15);
  });
});

describe("feedback learning", () => {
  it("summarizes outcomes and acceptance rate", () => {
    const fb: Feedback[] = [
      { recommendationId: "1", outcome: "accepted" },
      { recommendationId: "2", outcome: "rejected" },
      { recommendationId: "3", outcome: "accepted" },
      { recommendationId: "4", outcome: "ignored" },
    ];
    const s = summarizeFeedback(fb);
    expect(s.accepted).toBe(2);
    expect(s.acceptanceRate).toBe(0.5);
  });
  it("derives conservative steering on low acceptance", () => {
    const fb: Feedback[] = [
      { recommendationId: "1", outcome: "rejected" },
      { recommendationId: "2", outcome: "rejected" },
      { recommendationId: "3", outcome: "ignored" },
    ];
    const s = deriveSteering(fb);
    expect(s.preferConservative).toBe(true);
    expect(s.hints.length).toBeGreaterThan(0);
  });
});

describe("notifications", () => {
  it("proposes moving work into freed time on a cancellation", () => {
    const n = chiefNotifications(
      makeContext({ disruptions: [{ kind: "cancelled_event", detail: "meeting", minutes: 90 }] }),
    );
    expect(n.find((x) => x.kind === "free_time")).toBeDefined();
  });
  it("is silent when the profile is quiet", () => {
    const ctx = makeContext({
      profile: { ...defaultProfile(), notificationStyle: "quiet" },
      disruptions: [{ kind: "cancelled_event", detail: "m", minutes: 30 }],
    });
    expect(chiefNotifications(ctx)).toHaveLength(0);
  });
  it("warns on low readiness", () => {
    const n = chiefNotifications(makeContext({ readiness: 25 }));
    expect(n.find((x) => x.kind === "readiness")).toBeDefined();
  });
});

describe("chief engine orchestration", () => {
  it("produces a recommendation, notifications and a provider decision (offline→local)", () => {
    const r = runChief(makeContext());
    expect(r.recommendation.action).toBe("start_focus");
    expect(r.provider.provider).toBe("local");
  });
  it("routes reasoning to an available cloud provider when policy allows", () => {
    const r = runChief(makeContext(), { policy: { isAvailable: (p) => p === "anthropic" } });
    expect(r.provider.provider).toBe("anthropic");
  });
  it("runs the morning flow", () => {
    const m = runMorning(makeContext());
    expect(m.morning.greeting).toContain("Arnav");
    expect(m.provider.provider).toBe("local");
  });
});
