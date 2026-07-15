import { describe, expect, it } from "vitest";
import { decideDelivery, isPlatformChannel } from "../delivery";
import { defaultPreferences, updateCategory } from "../preferences";
import { makeNotification } from "../fixtures";

describe("delivery engine", () => {
  it("critical always delivers on persistent channels", () => {
    const d = decideDelivery(makeNotification({ priority: "critical" }), defaultPreferences());
    expect(d.deliver).toBe(true);
    expect(d.channels).toContain("persistent");
    expect(d.escalation).toBe("critical");
  });

  it("does not deliver when category disabled", () => {
    const prefs = updateCategory(defaultPreferences(), "reminder", { enabled: false });
    const d = decideDelivery(makeNotification({ type: "reminder", priority: "medium" }), prefs);
    expect(d.deliver).toBe(false);
    expect(d.channels).toEqual([]);
  });

  it("silent priority records on the silent channel only", () => {
    const d = decideDelivery(makeNotification({ priority: "silent" }), defaultPreferences());
    expect(d.channels).toEqual(["silent"]);
  });

  it("delivers per category preferences", () => {
    const prefs = updateCategory(defaultPreferences(), "reminder", {
      banner: true,
      desktop: true,
      push: false,
    });
    const d = decideDelivery(makeNotification({ type: "reminder", priority: "medium" }), prefs);
    expect(d.channels).toContain("banner");
    expect(d.channels).toContain("desktop");
    expect(d.channels).not.toContain("push");
  });

  it("falls back to toast when no channels enabled", () => {
    const prefs = updateCategory(defaultPreferences(), "reminder", {
      banner: false,
      desktop: false,
      push: false,
      sound: false,
      persistent: false,
    });
    const d = decideDelivery(makeNotification({ type: "reminder", priority: "medium" }), prefs);
    expect(d.channels).toEqual(["toast"]);
  });

  it("dedupes duplicate channels", () => {
    const d = decideDelivery(makeNotification({ priority: "critical" }), defaultPreferences());
    expect(new Set(d.channels).size).toBe(d.channels.length);
  });

  it("isPlatformChannel identifies desktop/push", () => {
    expect(isPlatformChannel("desktop")).toBe(true);
    expect(isPlatformChannel("push")).toBe(true);
    expect(isPlatformChannel("banner")).toBe(false);
  });
});
