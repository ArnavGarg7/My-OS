import { describe, expect, it } from "vitest";
import {
  addDependency,
  blockingDependencies,
  directDependencies,
  dependsOnTransitively,
  hasCycle,
  removeDependency,
  topologicalSort,
} from "./dependency";
import { makeTask, dep } from "./fixtures";
import type { TaskDependency } from "./types";

describe("addDependency", () => {
  it("adds a valid edge", () => {
    const r = addDependency([], "b", "a");
    expect(r.ok).toBe(true);
    expect(r.dependencies).toEqual([{ taskId: "b", dependsOnTaskId: "a" }]);
  });

  it("rejects self-references", () => {
    const r = addDependency([], "a", "a");
    expect(r).toMatchObject({ ok: false, error: "self-reference" });
  });

  it("rejects duplicate edges", () => {
    const r = addDependency([dep("b", "a")], "b", "a");
    expect(r).toMatchObject({ ok: false, error: "duplicate" });
  });

  it("rejects edges that would create a cycle", () => {
    // a depends on b; adding b depends on a → cycle
    const r = addDependency([dep("a", "b")], "b", "a");
    expect(r).toMatchObject({ ok: false, error: "cycle" });
  });

  it("rejects deep cycles", () => {
    const deps = [dep("a", "b"), dep("b", "c")];
    const r = addDependency(deps, "c", "a");
    expect(r).toMatchObject({ ok: false, error: "cycle" });
  });
});

describe("removeDependency", () => {
  it("removes a specific edge", () => {
    const deps = [dep("b", "a"), dep("c", "a")];
    expect(removeDependency(deps, "b", "a")).toEqual([dep("c", "a")]);
  });
});

describe("hasCycle", () => {
  it("is false for a DAG", () => {
    expect(hasCycle([dep("b", "a"), dep("c", "b")])).toBe(false);
  });
  it("is true for a cyclic graph", () => {
    expect(hasCycle([dep("a", "b"), dep("b", "a")])).toBe(true);
  });
});

describe("dependsOnTransitively", () => {
  it("follows the chain", () => {
    const deps = [dep("a", "b"), dep("b", "c")];
    expect(dependsOnTransitively("a", "c", deps)).toBe(true);
    expect(dependsOnTransitively("c", "a", deps)).toBe(false);
  });
});

describe("directDependencies", () => {
  it("lists only direct edges", () => {
    const deps = [dep("a", "b"), dep("a", "c"), dep("b", "d")];
    expect(directDependencies("a", deps).sort()).toEqual(["b", "c"]);
  });
});

describe("blockingDependencies", () => {
  it("returns only incomplete dependencies", () => {
    const tasks = [
      makeTask({ id: "a" }),
      makeTask({ id: "b", status: "completed" }),
      makeTask({ id: "c", status: "in_progress" }),
    ];
    const deps = [dep("a", "b"), dep("a", "c")];
    expect(blockingDependencies("a", deps, tasks)).toEqual(["c"]);
  });
});

describe("topologicalSort", () => {
  it("orders dependencies before dependents", () => {
    // research → design → implementation → testing → deployment
    const tasks = ["research", "design", "impl", "test", "deploy"].map((id) => makeTask({ id }));
    const deps: TaskDependency[] = [
      dep("design", "research"),
      dep("impl", "design"),
      dep("test", "impl"),
      dep("deploy", "test"),
    ];
    const order = topologicalSort(tasks, deps)!.map((t) => t.id);
    expect(order).toEqual(["research", "design", "impl", "test", "deploy"]);
  });

  it("returns null when a cycle exists", () => {
    const tasks = [makeTask({ id: "a" }), makeTask({ id: "b" })];
    expect(topologicalSort(tasks, [dep("a", "b"), dep("b", "a")])).toBeNull();
  });

  it("is deterministic for independent tasks (id order)", () => {
    const tasks = [makeTask({ id: "z" }), makeTask({ id: "a" }), makeTask({ id: "m" })];
    expect(topologicalSort(tasks, [])!.map((t) => t.id)).toEqual(["a", "m", "z"]);
  });
});
