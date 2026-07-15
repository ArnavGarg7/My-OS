import { describe, expect, it } from "vitest";
import { makeGoal, makeKeyResult, makeObjective } from "./fixtures";
import {
  addLink,
  goalsForProject,
  linkedProjectIds,
  linksOfType,
  removeLink,
  totalKeyResults,
} from "./hierarchy";

describe("hierarchy", () => {
  it("adds a link idempotently", () => {
    const g = addLink(addLink(makeGoal(), "project", "p1"), "project", "p1");
    expect(g.links).toHaveLength(1);
  });

  it("removes a link", () => {
    const g = addLink(makeGoal(), "task", "t1");
    expect(removeLink(g, "task", "t1").links).toHaveLength(0);
  });

  it("lists links of a type", () => {
    const g = addLink(addLink(makeGoal(), "project", "p1"), "journal_entry", "j1");
    expect(linksOfType(g, "project")).toEqual(["p1"]);
    expect(linkedProjectIds(g)).toEqual(["p1"]);
  });

  it("finds goals contributing to a project", () => {
    const goals = [addLink(makeGoal({ id: "a" }), "project", "p1"), makeGoal({ id: "b" })];
    expect(goalsForProject(goals, "p1").map((g) => g.id)).toEqual(["a"]);
  });

  it("counts total key results across objectives", () => {
    const goal = makeGoal({
      objectives: [
        makeObjective({
          id: "o1",
          keyResults: [makeKeyResult({ id: "a" }), makeKeyResult({ id: "b" })],
        }),
        makeObjective({ id: "o2", keyResults: [makeKeyResult({ id: "c" })] }),
      ],
    });
    expect(totalKeyResults(goal)).toBe(3);
  });
});
