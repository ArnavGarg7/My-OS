import { describe, expect, it } from "vitest";
import { createAiEngine } from "./engine";

describe("AiEngine composition root", () => {
  it("boots a deterministic offline platform with no clients", async () => {
    const engine = createAiEngine({ now: () => new Date("2026-07-18T00:00:00Z") });
    expect(engine.tier).toBe("local");
    expect(engine.registry.get("local").available).toBe(true);
    expect(engine.tools.list().length).toBeGreaterThan(0);
  });

  it("runs a request end-to-end and records telemetry into the collector", async () => {
    const engine = createAiEngine();
    const res = await engine.run({
      feature: "smoke",
      messages: [{ role: "user", content: "hello world" }],
    });
    expect(res.provider).toBe("local");
    expect(res.text).toContain("hello world");
    expect(engine.telemetry.all()).toHaveLength(1);
    expect(engine.telemetry.aggregate().count).toBe(1);
  });

  it("health-checks every provider", async () => {
    const health = await createAiEngine().health();
    expect(health).toHaveLength(5);
  });
});
