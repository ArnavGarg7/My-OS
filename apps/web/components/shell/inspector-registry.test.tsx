import { describe, expect, it } from "vitest";
import { INSPECTOR_REGISTRY, resolveInspector } from "./inspector-registry";

describe("inspector registry", () => {
  it("registers an inspector for every core route", () => {
    const routes = INSPECTOR_REGISTRY.map((e) => e.match);
    for (const r of ["/today", "/inbox", "/tasks", "/planner", "/calendar", "/projects"]) {
      expect(routes).toContain(r);
    }
  });

  it("resolves the inspector for an exact route", () => {
    expect(resolveInspector("/projects")).toBeTypeOf("function");
  });

  it("resolves the inspector for a nested route", () => {
    expect(resolveInspector("/projects/abc")).toBe(resolveInspector("/projects"));
  });

  it("returns null for an unknown route", () => {
    expect(resolveInspector("/settings")).toBeNull();
  });
});
