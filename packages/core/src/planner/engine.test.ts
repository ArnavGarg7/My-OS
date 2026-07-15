import { describe, expect, it } from "vitest";
import { PlannerEngine, plannerEngine } from "./engine";
import { taskBlocks } from "./selectors";
import { DATE, WH, at, makeBlockFixture, makeTask } from "./fixtures";
import { dep } from "../task/fixtures";
import type { PlannerInput } from "./types";

const engine = new PlannerEngine();

function input(over: Partial<PlannerInput> = {}): PlannerInput {
  return {
    date: DATE,
    now: at(9),
    workingHours: WH,
    focusWindow: null,
    tasks: [],
    dependencies: [],
    fixedBlocks: [],
    ...over,
  };
}

describe("generate", () => {
  it("produces a generated day and seeds a lunch break", () => {
    const result = engine.generate(input({ tasks: [makeTask({ id: "a" })] }));
    expect(result.day.status).toBe("generated");
    expect(result.day.generatedAt).not.toBeNull();
    expect(result.blocks.some((b) => b.type === "break" && b.title === "Lunch")).toBe(true);
  });

  it("allocates one block per open task", () => {
    const result = engine.generate(
      input({ tasks: [makeTask({ id: "a" }), makeTask({ id: "b" })] }),
    );
    expect(taskBlocks(result.blocks).filter((b) => b.taskId).length).toBe(2);
  });

  it("excludes completed tasks", () => {
    const result = engine.generate(
      input({ tasks: [makeTask({ id: "a" }), makeTask({ id: "b", status: "completed" })] }),
    );
    expect(result.blocks.some((b) => b.taskId === "b")).toBe(false);
  });

  it("schedules dependencies before dependents", () => {
    const tasks = [
      makeTask({ id: "impl", priority: "urgent" }),
      makeTask({ id: "design", priority: "low" }),
    ];
    const result = engine.generate(input({ tasks, dependencies: [dep("impl", "design")] }));
    const ordered = taskBlocks(result.blocks).filter((b) => b.taskId);
    expect(ordered[0]!.taskId).toBe("design");
    expect(ordered[1]!.taskId).toBe("impl");
  });

  it("preserves a locked block and does not re-allocate its task", () => {
    const locked = makeBlockFixture({
      id: "locked",
      taskId: "design",
      locked: true,
      startTime: at(15).toISOString(),
      endTime: at(16).toISOString(),
    });
    const result = engine.generate(
      input({
        tasks: [makeTask({ id: "design" }), makeTask({ id: "impl" })],
        fixedBlocks: [locked],
      }),
    );
    const designBlocks = result.blocks.filter((b) => b.taskId === "design");
    expect(designBlocks).toHaveLength(1);
    expect(designBlocks[0]!.id).toBe("locked");
  });

  it("marks focus-window blocks as focus", () => {
    const result = engine.generate(
      input({ tasks: [makeTask({ id: "a" })], focusWindow: { start: "09:00", end: "12:00" } }),
    );
    expect(result.blocks.some((b) => b.type === "focus")).toBe(true);
  });
});

describe("generate edge cases", () => {
  it("produces just a lunch break when there are no tasks", () => {
    const result = engine.generate(input());
    expect(result.blocks.every((b) => b.taskId === null)).toBe(true);
    expect(result.blocks.some((b) => b.title === "Lunch")).toBe(true);
  });

  it("surfaces an impossible-task conflict", () => {
    const result = engine.generate(
      input({ tasks: [makeTask({ id: "a", estimatedMinutes: 12 * 60 })] }),
    );
    expect(result.conflicts.some((c) => c.type === "impossible")).toBe(true);
  });

  it("is deterministic — same input yields the same block count", () => {
    const a = engine.generate(input({ tasks: [makeTask({ id: "a" }), makeTask({ id: "b" })] }));
    const b = engine.generate(input({ tasks: [makeTask({ id: "a" }), makeTask({ id: "b" })] }));
    expect(a.blocks.length).toBe(b.blocks.length);
  });
});

describe("optimize method", () => {
  it("re-optimizes an existing block set", () => {
    const t = makeBlockFixture({
      id: "t",
      type: "task",
      startTime: at(10).toISOString(),
      endTime: at(11).toISOString(),
    });
    const result = engine.optimize([t], at(9), at(12));
    expect(result[0]!.type).toBe("focus");
  });
});

describe("block operations", () => {
  it("lock / unlock toggles the flag", () => {
    const b = makeBlockFixture();
    expect(engine.lock(b).locked).toBe(true);
    expect(engine.unlock(engine.lock(b)).locked).toBe(false);
  });

  it("move shifts a block earlier or later", () => {
    const b = makeBlockFixture({ startTime: at(10).toISOString(), endTime: at(11).toISOString() });
    expect(new Date(engine.move(b, "later", 30).startTime).getMinutes()).toBe(30);
    expect(new Date(engine.move(b, "earlier", 60).startTime).getHours()).toBe(9);
  });
});

describe("singleton", () => {
  it("exposes a shared engine", () => {
    expect(plannerEngine).toBeInstanceOf(PlannerEngine);
  });
});
