import { describe, expect, it } from "vitest";
import { parseStep } from "./parser";

describe("parseStep", () => {
  it("maps exact step names", () => {
    expect(parseStep("review")).toBe("review");
    expect(parseStep("finalize")).toBe("finalize");
  });
  it("maps aliases + phrases", () => {
    expect(parseStep("carry forward my tasks")).toBe("carry_forward");
    expect(parseStep("set priorities")).toBe("priorities");
    expect(parseStep("preview the plan")).toBe("planner");
    expect(parseStep("check my meetings")).toBe("calendar");
    expect(parseStep("am I ready")).toBe("readiness");
    expect(parseStep("lock it in")).toBe("finalize");
  });
  it("returns null for gibberish", () => {
    expect(parseStep("wibble")).toBeNull();
  });
});

describe("schemas", () => {
  it("validate the tRPC inputs", async () => {
    const { selectPrioritiesSchema, confirmCarryForwardSchema, finalizeSchema } =
      await import("./schemas");
    expect(confirmCarryForwardSchema.parse({ acceptedIds: ["a", "b"] }).acceptedIds).toHaveLength(
      2,
    );
    expect(() =>
      selectPrioritiesSchema.parse({ priorities: new Array(6).fill({ title: "x" }) }),
    ).toThrow();
    expect(finalizeSchema.parse({ sleepTargetMinutes: 450 }).sleepTargetMinutes).toBe(450);
  });
});
