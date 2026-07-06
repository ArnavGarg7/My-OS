import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appStorage } from "../persistence";
import { useDebounce } from "./use-debounce";
import { useLocalStorage } from "./use-local-storage";
import { usePersistentState } from "./use-persistent-state";
import { usePrevious } from "./use-previous";
import { matchesCombo, parseCombo, useHotkeys } from "./use-hotkeys";

describe("useLocalStorage / usePersistentState", () => {
  beforeEach(() => window.localStorage.clear());

  it("starts from the initial value, then persists updates via appStorage", () => {
    const { result } = renderHook(() => useLocalStorage("myos-test-key", 1));
    expect(result.current[0]).toBe(1);

    act(() => result.current[1](5));
    expect(result.current[0]).toBe(5);
    expect(appStorage.get("myos-test-key", 0)).toBe(5);
  });

  it("supports functional updates and remove()", () => {
    const { result } = renderHook(() => useLocalStorage("myos-counter", 10));
    act(() => result.current[1]((n) => n + 1));
    expect(result.current[0]).toBe(11);

    act(() => result.current[2]());
    expect(result.current[0]).toBe(10);
    expect(window.localStorage.getItem("myos-counter")).toBeNull();
  });

  it("usePersistentState exposes a [value, setValue] tuple", () => {
    const { result } = renderHook(() => usePersistentState("myos-pref", "a"));
    act(() => result.current[1]("b"));
    expect(result.current[0]).toBe("b");
    expect(appStorage.get("myos-pref", "")).toBe("b");
  });
});

describe("usePrevious", () => {
  it("returns undefined first, then the prior value", () => {
    const { result, rerender } = renderHook(({ v }) => usePrevious(v), {
      initialProps: { v: 1 },
    });
    expect(result.current).toBeUndefined();
    rerender({ v: 2 });
    expect(result.current).toBe(1);
    rerender({ v: 3 });
    expect(result.current).toBe(2);
  });
});

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("only reflects the latest value after the delay elapses", () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 200), {
      initialProps: { v: "a" },
    });
    expect(result.current).toBe("a");

    rerender({ v: "b" });
    rerender({ v: "c" });
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe("c");
  });
});

describe("hotkey parsing", () => {
  it("parses modifiers and normalizes esc", () => {
    const combo = parseCombo("shift+esc");
    expect(combo).toMatchObject({ key: "escape", shift: true, hasModifier: false });
  });

  it("matches an event only when every modifier agrees", () => {
    const parsed = parseCombo("ctrl+k");
    const good = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
    const bad = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, shiftKey: true });
    expect(matchesCombo(parsed, good)).toBe(true);
    expect(matchesCombo(parsed, bad)).toBe(false);
  });
});

describe("useHotkeys", () => {
  it("invokes the handler when its combo is pressed on window", () => {
    const onSave = vi.fn();
    renderHook(() => useHotkeys({ "ctrl+s": onSave }));

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: true }));
    });
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
