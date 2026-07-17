import { describe, expect, it } from "vitest";
import { DASHBOARD_WIDGETS } from "./constants";
import type { DashboardPreferences } from "./types";
import { FIXED_NOW, makeInput, testEngine } from "./fixtures";

describe("engine — injected clock/ids, config + snapshots only", () => {
  it("default preferences list every widget in order, none hidden", () => {
    const prefs = testEngine().defaultPreferences();
    expect(prefs.widgetOrder).toEqual([...DASHBOARD_WIDGETS]);
    expect(prefs.hiddenWidgets).toEqual([]);
    expect(prefs.updatedAt).toBe(FIXED_NOW.toISOString());
  });

  it("reconcile keeps the user's order, appends new widgets, drops unknown ones", () => {
    const e = testEngine();
    const stored = {
      widgetOrder: ["health", "productivity", "bogus"],
      hiddenWidgets: ["timeline", "gone"],
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as unknown as DashboardPreferences;
    const reconciled = e.reconcilePreferences(stored);
    expect(reconciled.widgetOrder[0]).toBe("health");
    expect(reconciled.widgetOrder[1]).toBe("productivity");
    expect(reconciled.widgetOrder).toContain("today");
    expect(reconciled.widgetOrder).not.toContain("bogus");
    expect(reconciled.widgetOrder).toHaveLength(DASHBOARD_WIDGETS.length);
    expect(reconciled.hiddenWidgets).toEqual(["timeline"]);
  });

  it("builds a collection with a trimmed name and injected id", () => {
    const e = testEngine();
    const c = e.makeCollection({ name: "  Fitness  " });
    expect(c.id).toBe("id-1");
    expect(c.name).toBe("Fitness");
    expect(c.entityRefs).toEqual([]);
  });

  it("builds an immutable review snapshot stamped with the injected clock", () => {
    const e = testEngine();
    const snap = e.makeReviewSnapshot(makeInput(), "quarterly", "2026-04-01");
    expect(snap.period).toBe("quarterly");
    expect(snap.createdAt).toBe(FIXED_NOW.toISOString());
    expect(snap.areas).toHaveLength(8);
  });
});
