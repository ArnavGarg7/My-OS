import { describe, expect, it } from "vitest";
import { orderTasks, removeCompleted } from "./scheduler";
import { makeTask } from "./fixtures";
import { dep } from "../task/fixtures";

describe("removeCompleted", () => {
  it("drops completed and archived tasks", () => {
    const tasks = [
      makeTask({ id: "a" }),
      makeTask({ id: "b", status: "completed" }),
      makeTask({ id: "c", status: "archived" }),
    ];
    expect(removeCompleted(tasks).map((t) => t.id)).toEqual(["a"]);
  });
});

describe("orderTasks", () => {
  it("orders by priority when independent", () => {
    const tasks = [
      makeTask({ id: "low", priority: "low" }),
      makeTask({ id: "urgent", priority: "urgent" }),
      makeTask({ id: "medium", priority: "medium" }),
    ];
    expect(orderTasks(tasks, []).map((t) => t.id)).toEqual(["urgent", "medium", "low"]);
  });

  it("places dependencies before dependents", () => {
    const tasks = [
      makeTask({ id: "impl", priority: "urgent" }),
      makeTask({ id: "design", priority: "low" }),
    ];
    // impl depends on design → design must come first despite lower priority
    const order = orderTasks(tasks, [dep("impl", "design")]).map((t) => t.id);
    expect(order).toEqual(["design", "impl"]);
  });

  it("breaks ties by earlier due date", () => {
    const tasks = [
      makeTask({
        id: "later",
        priority: "high",
        dueAt: new Date("2026-07-10T09:00:00Z").toISOString(),
      }),
      makeTask({
        id: "sooner",
        priority: "high",
        dueAt: new Date("2026-07-08T09:00:00Z").toISOString(),
      }),
    ];
    expect(orderTasks(tasks, []).map((t) => t.id)).toEqual(["sooner", "later"]);
  });

  it("falls back to a priority sort when the graph has a cycle", () => {
    const tasks = [
      makeTask({ id: "a", priority: "low" }),
      makeTask({ id: "b", priority: "urgent" }),
    ];
    const order = orderTasks(tasks, [dep("a", "b"), dep("b", "a")]).map((t) => t.id);
    expect(order).toEqual(["b", "a"]);
  });

  it("orders a dependency chain fully", () => {
    const tasks = ["d", "c", "b", "a"].map((id) => makeTask({ id }));
    const order = orderTasks(tasks, [dep("b", "a"), dep("c", "b"), dep("d", "c")]).map((t) => t.id);
    expect(order).toEqual(["a", "b", "c", "d"]);
  });

  it("is deterministic by id for equal-priority independent tasks", () => {
    const tasks = [makeTask({ id: "z" }), makeTask({ id: "a" }), makeTask({ id: "m" })];
    expect(orderTasks(tasks, []).map((t) => t.id)).toEqual(["a", "m", "z"]);
  });

  it("returns an empty list for no tasks", () => {
    expect(orderTasks([], [])).toEqual([]);
  });

  it("prefers a due task over one with no due date at equal priority", () => {
    const tasks = [
      makeTask({ id: "nodue", priority: "medium" }),
      makeTask({
        id: "due",
        priority: "medium",
        dueAt: new Date("2026-07-08T09:00:00Z").toISOString(),
      }),
    ];
    expect(orderTasks(tasks, []).map((t) => t.id)).toEqual(["due", "nodue"]);
  });
});
