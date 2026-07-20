import { describe, expect, it } from "vitest";
import { ToolRegistry } from "./registry";
import { checkPermissions } from "./permissions";
import { validateToolInput } from "./validation";
import { executeTool } from "./executor";
import { BUILTIN_TOOLS } from "./definitions";
import type { ToolDefinition } from "../schemas";

const def: ToolDefinition = {
  name: "echo",
  description: "echoes input",
  permissions: ["read:tasks"],
  inputSchema: { type: "object", properties: { q: { type: "string" } }, required: ["q"] },
};

function registry() {
  return new ToolRegistry().register({
    definition: def,
    execute: (input) => ({ echoed: input.q }),
  });
}

describe("permissions", () => {
  it("allows when all granted, reports missing otherwise", () => {
    expect(checkPermissions(def, ["read:tasks"]).allowed).toBe(true);
    expect(checkPermissions(def, []).missing).toEqual(["read:tasks"]);
  });
});

describe("validation", () => {
  it("enforces required fields and types", () => {
    expect(validateToolInput(def, { q: "x" }).ok).toBe(true);
    expect(validateToolInput(def, {}).errors).toContain("missing required field: q");
    expect(validateToolInput(def, { q: 5 }).ok).toBe(false);
  });
});

describe("registry", () => {
  it("registers, lists (sorted), and looks up", () => {
    const reg = registry();
    expect(reg.has("echo")).toBe(true);
    expect(reg.list().map((t) => t.name)).toContain("echo");
    expect(reg.get("nope")).toBeNull();
  });

  it("registers all built-in read tools", () => {
    const reg = new ToolRegistry();
    for (const t of BUILTIN_TOOLS) reg.register(t);
    expect(reg.list().map((t) => t.name)).toEqual([
      "query_calendar",
      "query_tasks",
      "search_semantic",
    ]);
  });
});

describe("executor pipeline", () => {
  it("runs through permission + validation + execute", async () => {
    const r = await executeTool(registry(), "echo", { q: "hi" }, { granted: ["read:tasks"] });
    expect(r.ok).toBe(true);
    expect(r.result).toEqual({ echoed: "hi" });
  });

  it("stops at not_found / permission / validation stages", async () => {
    const reg = registry();
    expect((await executeTool(reg, "missing", {})).stage).toBe("not_found");
    expect((await executeTool(reg, "echo", { q: "x" }, { granted: [] })).stage).toBe("permission");
    expect((await executeTool(reg, "echo", {}, { granted: ["read:tasks"] })).stage).toBe(
      "validation",
    );
  });

  it("captures execution errors as structured results", async () => {
    const reg = new ToolRegistry().register({
      definition: { ...def, permissions: [] },
      execute: () => {
        throw new Error("boom");
      },
    });
    const r = await executeTool(reg, "echo", { q: "x" });
    expect(r.ok).toBe(false);
    expect(r.stage).toBe("execution");
    expect(r.error).toBe("boom");
  });

  it("built-in tools return an unwired marker without an injected handler", async () => {
    const reg = new ToolRegistry();
    for (const t of BUILTIN_TOOLS) reg.register(t);
    const r = await executeTool(reg, "query_tasks", {}, { granted: ["read:tasks"] });
    expect(r.ok).toBe(true);
    expect((r.result as { unwired: boolean }).unwired).toBe(true);
  });
});
