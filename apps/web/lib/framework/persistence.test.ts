import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS, appStorage } from "./persistence";

describe("appStorage", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it("returns the fallback when a key is absent", () => {
    expect(appStorage.get(STORAGE_KEYS.preferences, { reduceMotion: false })).toEqual({
      reduceMotion: false,
    });
  });

  it("round-trips JSON-serialized values", () => {
    appStorage.set(STORAGE_KEYS.panelWidths, { inspector: 320 });
    expect(appStorage.get(STORAGE_KEYS.panelWidths, {})).toEqual({ inspector: 320 });
    expect(window.localStorage.getItem(STORAGE_KEYS.panelWidths)).toBe('{"inspector":320}');
  });

  it("removes values", () => {
    appStorage.set(STORAGE_KEYS.lastRoute, "/today");
    appStorage.remove(STORAGE_KEYS.lastRoute);
    expect(appStorage.get(STORAGE_KEYS.lastRoute, "")).toBe("");
  });

  it("falls back on corrupt JSON instead of throwing", () => {
    window.localStorage.setItem(STORAGE_KEYS.inspector, "{not json");
    expect(appStorage.get(STORAGE_KEYS.inspector, "default")).toBe("default");
  });

  it("notifies same-tab subscribers on set and remove", () => {
    const listener = vi.fn();
    const unsubscribe = appStorage.subscribe(STORAGE_KEYS.sidebar, listener);

    appStorage.set(STORAGE_KEYS.sidebar, { collapsed: true });
    expect(listener).toHaveBeenCalledWith({ collapsed: true });

    appStorage.remove(STORAGE_KEYS.sidebar);
    expect(listener).toHaveBeenLastCalledWith(undefined);

    unsubscribe();
    appStorage.set(STORAGE_KEYS.sidebar, { collapsed: false });
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
