import { describe, expect, it } from "vitest";
import { explainBlock } from "./explainer";
import { at, makeBlockFixture, makeTask } from "./fixtures";
import { dep } from "../task/fixtures";

describe("explainBlock", () => {
  it("explains a dependency-root task block", () => {
    const block = makeBlockFixture({ id: "b", taskId: "a", type: "task" });
    const ex = explainBlock(block, {
      tasks: [makeTask({ id: "a", priority: "high" })],
      dependencies: [],
      focusActive: false,
    });
    expect(ex.reasons).toContain("High priority");
    expect(ex.reasons.some((r) => /Dependency root/.test(r))).toBe(true);
    expect(ex.reasons).toContain("Placed in the earliest available slot");
  });

  it("notes when a task is scheduled after its dependencies", () => {
    const block = makeBlockFixture({ id: "b", taskId: "impl", type: "task" });
    const ex = explainBlock(block, {
      tasks: [makeTask({ id: "impl" }), makeTask({ id: "design" })],
      dependencies: [dep("impl", "design")],
      focusActive: false,
    });
    expect(ex.reasons.some((r) => /after its dependencies/.test(r))).toBe(true);
  });

  it("notes when a task has a due date", () => {
    const block = makeBlockFixture({ id: "b", taskId: "a", type: "task" });
    const ex = explainBlock(block, {
      tasks: [makeTask({ id: "a", dueAt: at(15).toISOString() })],
      dependencies: [],
      focusActive: false,
    });
    expect(ex.reasons).toContain("Has a due date");
  });

  it("cites the focus window for a focus block", () => {
    const block = makeBlockFixture({ id: "b", taskId: "a", type: "focus" });
    const ex = explainBlock(block, {
      tasks: [makeTask({ id: "a" })],
      dependencies: [],
      focusActive: true,
    });
    expect(ex.reasons.some((r) => /focus window/.test(r))).toBe(true);
  });

  it("flags overflow blocks", () => {
    const block = makeBlockFixture({
      id: "b",
      taskId: "a",
      type: "overflow",
      startTime: at(18).toISOString(),
      endTime: at(19).toISOString(),
    });
    const ex = explainBlock(block, {
      tasks: [makeTask({ id: "a" })],
      dependencies: [],
      focusActive: false,
    });
    expect(ex.reasons.some((r) => /overflow/.test(r))).toBe(true);
  });

  it("explains non-task blocks", () => {
    expect(
      explainBlock(makeBlockFixture({ type: "break" }), {
        tasks: [],
        dependencies: [],
        focusActive: false,
      }).reasons[0],
    ).toMatch(/recovery/);
    expect(
      explainBlock(makeBlockFixture({ type: "buffer" }), {
        tasks: [],
        dependencies: [],
        focusActive: false,
      }).reasons[0],
    ).toMatch(/context switching/);
    expect(
      explainBlock(makeBlockFixture({ type: "meeting" }), {
        tasks: [],
        dependencies: [],
        focusActive: false,
      }).reasons[0],
    ).toMatch(/meeting/);
  });
});
