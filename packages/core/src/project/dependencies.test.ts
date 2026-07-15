import { describe, expect, it } from "vitest";
import { dep, makeProject } from "./fixtures";
import {
  addDependency,
  blockingDependencies,
  dependsOnTransitively,
  hasCycle,
  removeDependency,
  topologicalSort,
} from "./dependencies";

describe("dependencies", () => {
  it("adds a dependency", () => {
    const r = addDependency([], "b", "a");
    expect(r.ok).toBe(true);
    expect(r.dependencies).toEqual([dep("b", "a")]);
  });

  it("rejects a self-reference", () => {
    const r = addDependency([], "a", "a");
    expect(r).toMatchObject({ ok: false, error: "self-reference" });
  });

  it("rejects a duplicate", () => {
    const r = addDependency([dep("b", "a")], "b", "a");
    expect(r).toMatchObject({ ok: false, error: "duplicate" });
  });

  it("rejects a cycle", () => {
    const deps = [dep("b", "a"), dep("c", "b")];
    const r = addDependency(deps, "a", "c");
    expect(r).toMatchObject({ ok: false, error: "cycle" });
  });

  it("removes a dependency", () => {
    expect(removeDependency([dep("b", "a")], "b", "a")).toEqual([]);
  });

  it("detects transitive dependency", () => {
    const deps = [dep("c", "b"), dep("b", "a")];
    expect(dependsOnTransitively("c", "a", deps)).toBe(true);
    expect(dependsOnTransitively("a", "c", deps)).toBe(false);
  });

  it("detects a cycle in a graph", () => {
    expect(hasCycle([dep("a", "b"), dep("b", "a")])).toBe(true);
    expect(hasCycle([dep("b", "a")])).toBe(false);
  });

  it("lists incomplete blocking dependencies", () => {
    const projects = [
      makeProject({ id: "a", status: "active" }),
      makeProject({ id: "b", status: "completed" }),
    ];
    const deps = [dep("c", "a"), dep("c", "b")];
    expect(blockingDependencies("c", deps, projects)).toEqual(["a"]);
  });

  it("topologically sorts dependencies first", () => {
    const projects = [makeProject({ id: "c" }), makeProject({ id: "a" }), makeProject({ id: "b" })];
    const deps = [dep("c", "b"), dep("b", "a")];
    expect(topologicalSort(projects, deps)?.map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("breaks ties by id deterministically", () => {
    const projects = [makeProject({ id: "z" }), makeProject({ id: "a" }), makeProject({ id: "m" })];
    expect(topologicalSort(projects, [])?.map((p) => p.id)).toEqual(["a", "m", "z"]);
  });

  it("returns null on a cyclic graph", () => {
    const projects = [makeProject({ id: "a" }), makeProject({ id: "b" })];
    expect(topologicalSort(projects, [dep("a", "b"), dep("b", "a")])).toBeNull();
  });

  it("is a no-op when removing a missing dependency", () => {
    expect(removeDependency([dep("b", "a")], "x", "y")).toEqual([dep("b", "a")]);
  });

  it("reports no transitive path to self without an edge", () => {
    expect(dependsOnTransitively("a", "a", [])).toBe(true);
    expect(dependsOnTransitively("a", "b", [])).toBe(false);
  });

  it("ignores dependency edges referencing unknown projects when sorting", () => {
    const projects = [makeProject({ id: "a" }), makeProject({ id: "b" })];
    const order = topologicalSort(projects, [dep("b", "ghost")]);
    expect(order?.map((p) => p.id)).toEqual(["a", "b"]);
  });
});
