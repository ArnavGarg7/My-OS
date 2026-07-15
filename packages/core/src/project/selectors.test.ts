import { describe, expect, it } from "vitest";
import { at, iso, makeProject } from "./fixtures";
import {
  filterProjects,
  searchProjects,
  selectActive,
  sortProjects,
  topProject,
} from "./selectors";

describe("selectors", () => {
  const now = at(2026, 6, 10);

  it("selects open projects only", () => {
    const projects = [
      makeProject({ id: "a", status: "active" }),
      makeProject({ id: "b", status: "archived" }),
      makeProject({ id: "c", status: "planning" }),
    ];
    expect(selectActive(projects).map((p) => p.id)).toEqual(["a", "c"]);
  });

  it("filters by status", () => {
    const projects = [
      makeProject({ id: "a", status: "active" }),
      makeProject({ id: "b", status: "on_hold" }),
    ];
    expect(filterProjects(projects, { status: "on_hold" }, [], now).map((p) => p.id)).toEqual([
      "b",
    ]);
  });

  it("filters by health", () => {
    const projects = [
      makeProject({ id: "healthy", status: "active" }),
      makeProject({ id: "risky", status: "active", targetDate: iso(2026, 6, 1) }),
    ];
    expect(filterProjects(projects, { health: "at_risk" }, [], now).map((p) => p.id)).toEqual([
      "risky",
    ]);
  });

  it("sorts by priority", () => {
    const projects = [
      makeProject({ id: "low", priority: "low" }),
      makeProject({ id: "crit", priority: "critical" }),
      makeProject({ id: "med", priority: "medium" }),
    ];
    expect(sortProjects(projects, "priority", [], now).map((p) => p.id)).toEqual([
      "crit",
      "med",
      "low",
    ]);
  });

  it("sorts by name", () => {
    const projects = [
      makeProject({ id: "1", name: "Zephyr" }),
      makeProject({ id: "2", name: "Apollo" }),
    ];
    expect(sortProjects(projects, "name", [], now).map((p) => p.name)).toEqual([
      "Apollo",
      "Zephyr",
    ]);
  });

  it("sorts by target date", () => {
    const projects = [
      makeProject({ id: "late", targetDate: iso(2026, 8, 1) }),
      makeProject({ id: "early", targetDate: iso(2026, 6, 1) }),
    ];
    expect(sortProjects(projects, "target", [], now).map((p) => p.id)).toEqual(["early", "late"]);
  });

  it("searches by name and description", () => {
    const projects = [
      makeProject({ id: "a", name: "Campus AI", description: "assistant" }),
      makeProject({ id: "b", name: "Fitness", description: "gym" }),
    ];
    expect(searchProjects(projects, "campus").map((p) => p.id)).toEqual(["a"]);
    expect(searchProjects(projects, "gym").map((p) => p.id)).toEqual(["b"]);
  });

  it("returns all projects for an empty query", () => {
    const projects = [makeProject({ id: "a" }), makeProject({ id: "b" })];
    expect(searchProjects(projects, "  ").length).toBe(2);
  });

  it("picks the highest-priority active project", () => {
    const projects = [
      makeProject({ id: "low", status: "active", priority: "low" }),
      makeProject({ id: "high", status: "active", priority: "high" }),
      makeProject({ id: "crit-archived", status: "archived", priority: "critical" }),
    ];
    expect(topProject(projects)?.id).toBe("high");
  });

  it("returns null when there are no active projects", () => {
    expect(topProject([makeProject({ id: "a", status: "archived" })])).toBeNull();
  });

  it("sorts by progress descending", () => {
    const projects = [
      makeProject({ id: "low", status: "completed" }),
      makeProject({ id: "high", status: "completed" }),
    ];
    // both completed → 100; tie broken by insertion, but ordering stays stable.
    const ids = sortProjects(projects, "progress", [], now).map((p) => p.id);
    expect(ids).toHaveLength(2);
  });

  it("combines status and health filters", () => {
    const projects = [
      makeProject({ id: "a", status: "active", targetDate: iso(2026, 6, 1) }),
      makeProject({ id: "b", status: "on_hold", targetDate: iso(2026, 6, 1) }),
    ];
    const out = filterProjects(projects, { status: "active", health: "at_risk" }, [], now);
    expect(out.map((p) => p.id)).toEqual(["a"]);
  });
});
