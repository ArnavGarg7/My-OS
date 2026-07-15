import { describe, expect, it } from "vitest";
import { DecisionEngine, decisionEngine } from "./engine";
import { at, makeContext, makeDecision, makeFocus } from "./fixtures";

const engine = new DecisionEngine();

describe("DecisionEngine.generate", () => {
  it("creates ranked pending decisions from matching rules", () => {
    const decisions = engine.generate(makeContext({ now: at(10) }), []);
    const ids = decisions.map((d) => d.ruleId);
    expect(ids).toContain("no-mission");
    expect(ids).toContain("protect-focus");
    expect(decisions.every((d) => d.state === "pending")).toBe(true);
  });

  it("assigns empty ids + non-zero scores to new decisions", () => {
    const decisions = engine.generate(makeContext({ now: at(10) }), []);
    const noMission = decisions.find((d) => d.ruleId === "no-mission")!;
    expect(noMission.id).toBe("");
    expect(noMission.score).toBeGreaterThan(0);
  });

  it("replaces (dedups) an existing decision in place — same id, fresh content", () => {
    const existing = makeDecision({
      id: "keep-me",
      ruleId: "no-mission",
      title: "stale",
      state: "pending",
    });
    const decisions = engine.generate(makeContext({ now: at(10) }), [existing]);
    const noMission = decisions.find((d) => d.ruleId === "no-mission")!;
    expect(noMission.id).toBe("keep-me");
    expect(noMission.title).toBe("Set your mission for today.");
    expect(decisions.filter((d) => d.ruleId === "no-mission")).toHaveLength(1);
  });

  it("keeps a dismissed decision dismissed while in cooldown", () => {
    const existing = makeDecision({
      ruleId: "no-mission",
      state: "dismissed",
      metadata: { cooldownUntil: at(12).toISOString() },
    });
    const decisions = engine.generate(makeContext({ now: at(10) }), [existing]);
    expect(decisions.find((d) => d.ruleId === "no-mission")!.state).toBe("dismissed");
  });

  it("resurfaces a dismissed decision after its cooldown ends", () => {
    const existing = makeDecision({
      ruleId: "no-mission",
      state: "dismissed",
      metadata: { cooldownUntil: at(9).toISOString() },
    });
    const decisions = engine.generate(makeContext({ now: at(10) }), [existing]);
    expect(decisions.find((d) => d.ruleId === "no-mission")!.state).toBe("pending");
  });

  it("keeps a deferred decision until it is due", () => {
    const existing = makeDecision({
      ruleId: "no-mission",
      state: "deferred",
      deferredUntil: at(12).toISOString(),
    });
    const decisions = engine.generate(makeContext({ now: at(10) }), [existing]);
    expect(decisions.find((d) => d.ruleId === "no-mission")!.state).toBe("deferred");
  });

  it("leaves accepted decisions untouched", () => {
    const existing = makeDecision({ ruleId: "no-mission", state: "accepted" });
    const decisions = engine.generate(makeContext({ now: at(10) }), [existing]);
    expect(decisions.find((d) => d.ruleId === "no-mission")!.state).toBe("accepted");
  });

  it("expires a pending decision whose rule no longer fires", () => {
    const existing = makeDecision({ ruleId: "high-interruptions", state: "pending" });
    // ctx has 0 interruptions → rule doesn't match
    const decisions = engine.generate(makeContext({ now: at(10) }), [existing]);
    expect(decisions.find((d) => d.ruleId === "high-interruptions")!.state).toBe("expired");
  });

  it("produces continue-mission when a mission is set within hours", () => {
    const decisions = engine.generate(
      makeContext({ now: at(10), focus: makeFocus({ mission: "Ship 2.3" }) }),
      [],
    );
    const cont = decisions.find((d) => d.ruleId === "continue-mission");
    expect(cont?.title).toBe("Continue: Ship 2.3");
  });
});

describe("DecisionEngine lifecycle transitions", () => {
  const d = makeDecision();

  it("accept sets state + timestamp", () => {
    const r = engine.accept(d, at(10));
    expect(r.state).toBe("accepted");
    expect(r.metadata.acceptedAt).toBe(at(10).toISOString());
  });

  it("dismiss sets a cooldown", () => {
    const r = engine.dismiss(d, at(10));
    expect(r.state).toBe("dismissed");
    expect(typeof r.metadata.cooldownUntil).toBe("string");
  });

  it("defer stores the reappear time", () => {
    const r = engine.defer(d, at(11));
    expect(r.state).toBe("deferred");
    expect(r.deferredUntil).toBe(at(11).toISOString());
  });

  it("complete + expire set their states", () => {
    expect(engine.complete(d, at(10)).state).toBe("completed");
    expect(engine.complete(d, at(10)).completedAt).toBe(at(10).toISOString());
    expect(engine.expire(d).state).toBe("expired");
  });

  it("replace swaps content but keeps the row pending", () => {
    const r = engine.replace(makeDecision({ title: "Finish assignment" }), {
      title: "Continue assignment",
      reason: "In progress",
      confidence: 80,
      type: "college",
      priority: "high",
      inputsUsed: ["Planner"],
    });
    expect(r.title).toBe("Continue assignment");
    expect(r.state).toBe("pending");
  });

  it("rank delegates to the ranking selector", () => {
    const ranked = decisionEngine.rank([
      makeDecision({ ruleId: "lo", priority: "low" }),
      makeDecision({ ruleId: "hi", priority: "critical" }),
    ]);
    expect(ranked[0]?.ruleId).toBe("hi");
  });
});
