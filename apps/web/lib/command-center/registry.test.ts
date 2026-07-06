import { describe, expect, it, vi } from "vitest";
import { CommandRegistry } from "./registry";
import type { Command, CommandGroup } from "./types";

function cmd(id: string, overrides: Partial<Command> = {}): Command {
  return {
    id,
    title: id,
    category: "system",
    execute: vi.fn(),
    ...overrides,
  };
}

describe("CommandRegistry", () => {
  it("registers and finds a command", () => {
    const r = new CommandRegistry();
    r.register(cmd("a"));
    expect(r.find("a")?.id).toBe("a");
    expect(r.list()).toHaveLength(1);
  });

  it("unregisters via the returned disposer", () => {
    const r = new CommandRegistry();
    const off = r.register(cmd("a"));
    off();
    expect(r.find("a")).toBeUndefined();
    expect(r.list()).toHaveLength(0);
  });

  it("registers and removes a group (with its commands)", () => {
    const r = new CommandRegistry();
    const group: CommandGroup = {
      id: "g",
      title: "Group",
      category: "navigation",
      commands: [cmd("a", { category: "navigation" }), cmd("b", { category: "navigation" })],
    };
    r.registerGroup(group);
    expect(r.list()).toHaveLength(2);
    expect(r.getGroups().map((g) => g.id)).toContain("g");

    r.removeGroup("g");
    expect(r.list()).toHaveLength(0);
    expect(r.getGroups()).toHaveLength(0);
  });

  it("disable() overrides command.enabled()", () => {
    const r = new CommandRegistry();
    r.register(cmd("a", { enabled: () => true }));
    expect(r.isEnabled("a")).toBe(true);
    r.disable("a");
    expect(r.isEnabled("a")).toBe(false);
    r.enable("a");
    expect(r.isEnabled("a")).toBe(true);
  });

  it("respects command.enabled() and visible()", () => {
    const r = new CommandRegistry();
    r.register(cmd("a", { enabled: () => false, visible: () => false }));
    expect(r.isEnabled("a")).toBe(false);
    expect(r.isVisible("a")).toBe(false);
  });

  it("replace() swaps a command in place", () => {
    const r = new CommandRegistry();
    r.register(cmd("a", { title: "Old" }), "g");
    r.replace(cmd("a", { title: "New" }));
    expect(r.find("a")?.title).toBe("New");
    expect(r.groupOf("a")).toBe("g");
  });

  it("getByCategory filters by category", () => {
    const r = new CommandRegistry();
    r.register(cmd("a", { category: "navigation" }));
    r.register(cmd("b", { category: "system" }));
    expect(r.getByCategory("navigation").map((c) => c.id)).toEqual(["a"]);
  });

  it("sorts by group priority then command priority", () => {
    const r = new CommandRegistry();
    r.registerGroup({
      id: "low",
      title: "Low",
      category: "system",
      priority: 1,
      commands: [cmd("x")],
    });
    r.registerGroup({
      id: "high",
      title: "High",
      category: "system",
      priority: 10,
      commands: [cmd("a", { priority: 1 }), cmd("b", { priority: 5 })],
    });
    expect(r.list().map((c) => c.id)).toEqual(["b", "a", "x"]);
  });

  it("notifies subscribers on change and clears", () => {
    const r = new CommandRegistry();
    const listener = vi.fn();
    r.subscribe(listener);
    r.register(cmd("a"));
    expect(listener).toHaveBeenCalledTimes(1);
    r.clear();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(r.list()).toHaveLength(0);
  });

  it("throws on an invalid command", () => {
    const r = new CommandRegistry();
    // @ts-expect-error — intentionally invalid
    expect(() => r.register({ id: "", title: "x", category: "system" })).toThrow();
  });
});
