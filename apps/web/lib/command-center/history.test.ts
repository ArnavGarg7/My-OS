import { beforeEach, describe, expect, it } from "vitest";
import { CommandHistory } from "./history";

const KEY = "myos-test-command-history";

describe("CommandHistory", () => {
  beforeEach(() => window.localStorage.clear());

  it("records recent (most-recent-first, de-duplicated)", () => {
    const h = new CommandHistory(KEY);
    h.record("a");
    h.record("b");
    h.record("a");
    expect(h.getRecent()).toEqual(["a", "b"]);
    expect(h.getLastExecuted()).toBe("a");
  });

  it("tracks frequency", () => {
    const h = new CommandHistory(KEY);
    h.record("a");
    h.record("a");
    h.record("b");
    expect(h.getFrequent(1)).toEqual(["a"]);
  });

  it("pins and unpins", () => {
    const h = new CommandHistory(KEY);
    h.pin("a");
    expect(h.isPinned("a")).toBe(true);
    expect(h.getPinned()).toEqual(["a"]);
    h.togglePin("a");
    expect(h.isPinned("a")).toBe(false);
  });

  it("persists across instances (framework persistence)", () => {
    const h1 = new CommandHistory(KEY);
    h1.record("a");
    h1.pin("b");
    const h2 = new CommandHistory(KEY);
    expect(h2.getRecent()).toEqual(["a"]);
    expect(h2.isPinned("b")).toBe(true);
  });

  it("clear() resets state", () => {
    const h = new CommandHistory(KEY);
    h.record("a");
    h.clear();
    expect(h.getRecent()).toEqual([]);
    expect(h.getLastExecuted()).toBeNull();
  });

  it("notifies subscribers", () => {
    const h = new CommandHistory(KEY);
    let calls = 0;
    h.subscribe(() => calls++);
    h.record("a");
    expect(calls).toBe(1);
  });
});
