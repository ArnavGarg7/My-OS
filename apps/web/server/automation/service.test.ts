import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeRule } from "@myos/core/automation";

// AutomationService is server-only; mock the repository + action executor + stats.
const h = vi.hoisted(() => ({
  list: vi.fn(),
  getById: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  setStatus: vi.fn(),
  remove: vi.fn(),
  recordExecution: vi.fn(),
  listHistory: vi.fn(),
  allHistory: vi.fn(),
  upsertStatistics: vi.fn(),
  dispatchAction: vi.fn(),
  ruleStatistics: vi.fn(),
  focusActive: vi.fn(),
  listBlocks: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);
vi.mock("./executor", () => ({ dispatchAction: h.dispatchAction }));
vi.mock("./statistics", () => ({ ruleStatistics: h.ruleStatistics }));
vi.mock("../focus/service", () => ({ active: h.focusActive }));
vi.mock("../planner/repository", () => ({ listBlocks: h.listBlocks }));

import * as service from "./service";

const db = {} as never;
const prefs = { timezone: "UTC", preferredStartOfDay: "09:00", preferredEndOfDay: "17:00" };
const NOW = new Date("2026-07-15T12:00:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  h.list.mockResolvedValue([]);
  h.allHistory.mockResolvedValue([]);
  h.listHistory.mockResolvedValue([]);
  h.getById.mockResolvedValue(null);
  h.insert.mockImplementation((_db, r) => Promise.resolve(r));
  h.update.mockImplementation((_db, r) => Promise.resolve(r));
  h.recordExecution.mockResolvedValue(undefined);
  h.ruleStatistics.mockResolvedValue({
    ruleId: "r",
    executions: 0,
    successes: 0,
    failures: 0,
    skipped: 0,
    averageRuntimeMs: 0,
    failureRate: 0,
    lastRunAt: null,
    lastOutcome: null,
  });
  h.dispatchAction.mockResolvedValue({ actionId: "a1", kind: "noop", ok: true });
  h.focusActive.mockResolvedValue(null);
  h.listBlocks.mockResolvedValue([]);
  h.setStatus.mockResolvedValue(undefined);
  h.remove.mockResolvedValue(undefined);
});

describe("create", () => {
  it("validates + inserts an enabled rule", async () => {
    const rule = await service.create(db, {
      name: "My rule",
      trigger: { kind: "task", event: "task.created" },
      actions: [{ id: "a1", kind: "noop", params: {}, order: 0 }],
    });
    expect(rule.status).toBe("enabled");
    expect(h.insert).toHaveBeenCalledOnce();
  });

  it("rejects an invalid rule", async () => {
    await expect(
      service.create(db, {
        name: "",
        trigger: { kind: "task", event: "task.created" },
        actions: [],
      }),
    ).rejects.toThrow();
  });

  it("rejects a recursive rule", async () => {
    await expect(
      service.create(db, {
        name: "loop",
        trigger: { kind: "planner", event: "planner.generated" },
        actions: [{ id: "a1", kind: "generate_planner", params: {}, order: 0 }],
      }),
    ).rejects.toThrow();
  });
});

describe("lifecycle", () => {
  it("enable/disable set status", async () => {
    h.getById.mockResolvedValue(makeRule({ status: "enabled" }));
    await service.enable(db, "r1");
    expect(h.setStatus).toHaveBeenCalledWith(db, "r1", "enabled");
    await service.disable(db, "r1");
    expect(h.setStatus).toHaveBeenCalledWith(db, "r1", "disabled");
  });

  it("delete blocks built-in rules", async () => {
    h.getById.mockResolvedValue(makeRule({ builtIn: true }));
    await expect(service.remove(db, "r1")).rejects.toThrow();
  });

  it("delete removes a custom rule", async () => {
    h.getById.mockResolvedValue(makeRule({ builtIn: false }));
    expect(await service.remove(db, "r1")).toEqual({ id: "r1" });
    expect(h.remove).toHaveBeenCalled();
  });

  it("update patches + revalidates", async () => {
    h.getById.mockResolvedValue(makeRule());
    const updated = await service.update(db, "rule-1", { name: "Renamed" });
    expect(updated.name).toBe("Renamed");
    expect(h.update).toHaveBeenCalled();
  });
});

describe("execute", () => {
  it("runs actions when the plan allows", async () => {
    h.getById.mockResolvedValue(makeRule({ status: "enabled", policy: { policy: "run_always" } }));
    const record = await service.execute(db, "rule-1", prefs, {}, NOW);
    expect(record.outcome).toBe("completed");
    expect(h.dispatchAction).toHaveBeenCalled();
    expect(h.recordExecution).toHaveBeenCalled();
  });

  it("skips when conditions fail", async () => {
    h.getById.mockResolvedValue(
      makeRule({
        status: "enabled",
        conditions: {
          combinator: "and",
          conditions: [{ id: "c1", field: "x", operator: "greater_than", value: 100 }],
        },
      }),
    );
    const record = await service.execute(db, "rule-1", prefs, { x: 1 }, NOW);
    expect(record.outcome).toBe("conditions_failed");
    expect(h.dispatchAction).not.toHaveBeenCalled();
  });

  it("records a failed outcome when an action fails", async () => {
    h.getById.mockResolvedValue(makeRule({ status: "enabled" }));
    h.dispatchAction.mockResolvedValue({ actionId: "a1", kind: "noop", ok: false, detail: "boom" });
    const record = await service.execute(db, "rule-1", prefs, {}, NOW);
    expect(record.outcome).toBe("failed");
  });

  it("throws when rule not found", async () => {
    h.getById.mockResolvedValue(null);
    await expect(service.execute(db, "missing", prefs, {}, NOW)).rejects.toThrow();
  });
});

describe("preview", () => {
  it("previews an existing rule", async () => {
    h.getById.mockResolvedValue(makeRule({ status: "enabled" }));
    const preview = await service.preview(db, { id: "rule-1" }, prefs, NOW);
    expect(preview.wouldExecute).toBe(true);
  });

  it("previews a draft without persisting", async () => {
    const preview = await service.preview(
      db,
      {
        draft: {
          name: "Draft",
          trigger: { kind: "planner", event: "planner.generated" },
          actions: [{ id: "a1", kind: "noop", params: {}, order: 0 }],
        },
      },
      prefs,
      NOW,
    );
    expect(preview.triggerMatches).toBe(true);
    expect(h.insert).not.toHaveBeenCalled();
  });
});

describe("fire + seed", () => {
  it("fire runs matched rules", async () => {
    h.list.mockResolvedValue([makeRule({ id: "rule-1", status: "enabled" })]);
    h.getById.mockResolvedValue(makeRule({ id: "rule-1", status: "enabled" }));
    const records = await service.fire(
      db,
      {
        id: "e1",
        kind: "planner",
        event: "planner.generated",
        source: "planner",
        timestamp: NOW.toISOString(),
        payload: {},
        metadata: {},
      },
      prefs,
      NOW,
    );
    expect(records.length).toBe(1);
  });

  it("seedBuiltins inserts the built-in rules once", async () => {
    h.list.mockResolvedValue([]);
    const created = await service.seedBuiltins(db);
    expect(created).toBe(9);
    expect(h.insert).toHaveBeenCalledTimes(9);
  });

  it("seedBuiltins is idempotent", async () => {
    h.list.mockResolvedValue([makeRule({ builtIn: true })]);
    expect(await service.seedBuiltins(db)).toBe(0);
  });

  it("summary reflects enabled rules", async () => {
    h.list.mockResolvedValue([makeRule({ status: "enabled" })]);
    const s = await service.summary(db, "UTC", NOW);
    expect(s.enabledRules).toBe(1);
  });
});
