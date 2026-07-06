import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommandExecutor } from "./executor";
import { CommandHistory } from "./history";
import { CommandRegistry } from "./registry";
import type { Command } from "./types";

function makeSetup() {
  const registry = new CommandRegistry();
  const history = new CommandHistory("myos-test-exec-history");
  const executor = new CommandExecutor(registry, history);
  return { registry, history, executor };
}

function cmd(id: string, overrides: Partial<Command> = {}): Command {
  return { id, title: id, category: "system", execute: vi.fn(), ...overrides };
}

describe("CommandExecutor", () => {
  beforeEach(() => window.localStorage.clear());

  it("executes an enabled command, records history, returns success", async () => {
    const { registry, history, executor } = makeSetup();
    const execute = vi.fn();
    registry.register(cmd("a", { execute }));

    const result = await executor.execute("a", { source: "palette" });

    expect(execute).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("success");
    expect(history.getRecent()).toEqual(["a"]);
  });

  it("passes an execution context with the given source and close()", async () => {
    const { registry, executor } = makeSetup();
    const close = vi.fn();
    const execute = vi.fn();
    registry.register(cmd("a", { execute }));

    await executor.execute("a", { source: "palette", query: "q", close });
    const ctx = execute.mock.calls[0]![0];
    expect(ctx.source).toBe("palette");
    expect(ctx.query).toBe("q");
    ctx.close();
    expect(close).toHaveBeenCalled();
  });

  it("returns noop for a disabled command and does not run it", async () => {
    const { registry, history, executor } = makeSetup();
    const execute = vi.fn();
    registry.register(cmd("a", { execute, enabled: () => false }));

    const result = await executor.execute("a");
    expect(result.status).toBe("noop");
    expect(execute).not.toHaveBeenCalled();
    expect(history.getRecent()).toEqual([]);
  });

  it("returns an error for an unknown command", async () => {
    const { executor } = makeSetup();
    const result = await executor.execute("missing");
    expect(result.status).toBe("error");
  });

  it("never throws when a command throws; returns an error result", async () => {
    const { registry, executor } = makeSetup();
    registry.register(
      cmd("boom", {
        execute: () => {
          throw new Error("kaboom");
        },
      }),
    );
    const result = await executor.execute("boom");
    expect(result.status).toBe("error");
    expect(result.error).toBeInstanceOf(Error);
  });

  it("normalizes a returned false into noop", async () => {
    const { registry, executor } = makeSetup();
    registry.register(cmd("a", { execute: () => false }));
    const result = await executor.execute("a");
    expect(result.status).toBe("noop");
  });
});
