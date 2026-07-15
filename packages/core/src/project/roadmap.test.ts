import { describe, expect, it } from "vitest";
import { iso, makeMilestone, makeProject } from "./fixtures";
import { buildRoadmap, groupByQuarter } from "./roadmap";

describe("roadmap", () => {
  const project = makeProject({
    id: "p1",
    name: "Campus AI",
    milestones: [
      makeMilestone({ id: "m2", title: "Beta", dueDate: iso(2026, 9, 5) }),
      makeMilestone({ id: "m1", title: "Alpha", dueDate: iso(2026, 6, 15) }),
      makeMilestone({ id: "m3", title: "No date", dueDate: null }),
    ],
  });

  it("builds a chronologically ordered roadmap", () => {
    const items = buildRoadmap([project]);
    expect(items.map((i) => i.milestoneId)).toEqual(["m1", "m2"]);
  });

  it("skips milestones without a due date", () => {
    expect(buildRoadmap([project]).some((i) => i.milestoneId === "m3")).toBe(false);
  });

  it("tags quarter and month", () => {
    const item = buildRoadmap([project])[0];
    expect(item?.quarter).toBe("2026 Q3");
    expect(item?.month).toBe("2026-07");
    expect(item?.projectName).toBe("Campus AI");
  });

  it("computes Q4 for an October milestone", () => {
    const p = makeProject({
      id: "p2",
      milestones: [makeMilestone({ id: "q4", dueDate: iso(2026, 10, 1) })],
    });
    expect(buildRoadmap([p])[0]?.quarter).toBe("2026 Q4");
  });

  it("groups items by quarter", () => {
    const grouped = groupByQuarter(buildRoadmap([project]));
    expect(grouped.get("2026 Q3")?.length).toBe(1);
    expect(grouped.get("2026 Q4")?.length).toBe(1);
  });

  it("returns an empty roadmap for a project with no milestones", () => {
    expect(buildRoadmap([makeProject({ id: "empty" })])).toEqual([]);
  });
});
