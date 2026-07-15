import { describe, expect, it } from "vitest";
import { affectedModules, hasCycle, subgraph, topologicalOrder } from "../dependency-graph";
import { MODULE_DEPENDENCIES } from "../constants";

describe("dependency graph", () => {
  it("computes affected modules downstream of calendar", () => {
    const affected = affectedModules("calendar");
    expect(affected).toContain("planner");
    expect(affected).toContain("decision");
    expect(affected).toContain("timeline");
    expect(affected).toContain("analytics");
    expect(affected).not.toContain("calendar");
  });

  it("finance affects decision + notification + timeline + analytics", () => {
    const affected = affectedModules("finance");
    expect(affected).toEqual(
      expect.arrayContaining(["decision", "notification", "timeline", "analytics"]),
    );
  });

  it("analytics is a terminal sink", () => {
    expect(affectedModules("analytics")).toEqual([]);
  });

  it("topological order respects edges on an acyclic subgraph", () => {
    const nodes = ["finance", "decision", "notification", "timeline", "analytics"];
    const order = topologicalOrder(nodes, subgraph(nodes, MODULE_DEPENDENCIES));
    expect(order.indexOf("finance")).toBeLessThan(order.indexOf("decision"));
    expect(order.indexOf("decision")).toBeLessThan(order.indexOf("notification"));
    expect(order.indexOf("timeline")).toBeLessThan(order.indexOf("analytics"));
  });

  it("detects a cycle", () => {
    const graph = { a: ["b"], b: ["c"], c: ["a"] };
    expect(hasCycle(["a", "b", "c"], graph)).toBe(true);
    expect(() => topologicalOrder(["a", "b", "c"], graph)).toThrow(/[Cc]ycle/);
  });

  it("no cycle on a DAG", () => {
    const graph = { a: ["b"], b: ["c"], c: [] };
    expect(hasCycle(["a", "b", "c"], graph)).toBe(false);
  });

  it("subgraph restricts edges to the node set", () => {
    const sub = subgraph(["planner", "focus"], MODULE_DEPENDENCIES);
    expect(sub.planner).toEqual(["focus"]);
    expect(sub.focus ?? []).not.toContain("health"); // health not in the node set
  });

  it("topological order is stable / deterministic", () => {
    const nodes = ["finance", "decision", "notification"];
    const a = topologicalOrder(nodes, subgraph(nodes, MODULE_DEPENDENCIES));
    const b = topologicalOrder(nodes, subgraph(nodes, MODULE_DEPENDENCIES));
    expect(a).toEqual(b);
  });
});
