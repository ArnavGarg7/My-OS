import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeSession } from "@myos/core/focus";

// FocusService is server-only; mock the repository, health signals and the summary
// side-effect. Verify the deterministic orchestration + integration wiring.
const h = vi.hoisted(() => ({
  getActive: vi.fn(),
  getById: vi.fn(),
  listByDate: vi.fn(),
  history: vi.fn(),
  insertSession: vi.fn(),
  updateSession: vi.fn(),
  insertInterruption: vi.fn(),
  insertBreak: vi.fn(),
  closeOpenBreaks: vi.fn(),
  getSummary: vi.fn(),
  upsertSummary: vi.fn(),
  buildHealthSignals: vi.fn(),
  persistDailySummary: vi.fn(),
}));

const taskSvc = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);
vi.mock("./summary", () => ({ persistDailySummary: h.persistDailySummary }));
vi.mock("../health/summary", () => ({ buildSignals: h.buildHealthSignals }));
vi.mock("../task/service", () => taskSvc);

import * as service from "./service";

const TZ = "UTC";

// A chainable db stub for the planner-block execution update.
const plannerUpdate = { set: vi.fn(), where: vi.fn() };
plannerUpdate.set.mockReturnValue(plannerUpdate);
plannerUpdate.where.mockReturnValue(Promise.resolve());
const db = { update: vi.fn(() => plannerUpdate) };
const asDb = db as never;

beforeEach(() => {
  vi.clearAllMocks();
  h.getActive.mockResolvedValue(null);
  h.listByDate.mockResolvedValue([]);
  h.history.mockResolvedValue([]);
  h.persistDailySummary.mockResolvedValue(undefined);
  h.buildHealthSignals.mockResolvedValue({
    readiness: 80,
    recovery: "high",
    sleepMinutes: 450,
    energy: "high",
    hydrationPercent: 70,
    lowSleep: false,
    highReadiness: true,
    nextWorkoutType: null,
  });
  h.insertSession.mockImplementation((_db, s) => Promise.resolve(s));
  h.updateSession.mockImplementation((_db, s) => Promise.resolve(s));
  h.getById.mockResolvedValue(makeSession({ status: "running" }));
  plannerUpdate.set.mockReturnValue(plannerUpdate);
  plannerUpdate.where.mockReturnValue(Promise.resolve());
  taskSvc.get.mockResolvedValue({ id: "t1", status: "not_started", actualMinutes: null });
  taskSvc.update.mockResolvedValue({});
});

describe("FocusService.start", () => {
  it("inserts a running session", async () => {
    const s = await service.start(asDb, TZ, { taskId: "t1", type: "deep_work" });
    expect(s.status).toBe("running");
    expect(h.insertSession).toHaveBeenCalledOnce();
    expect(h.persistDailySummary).toHaveBeenCalled();
  });

  it("abandons an existing active session before starting a new one", async () => {
    h.getActive.mockResolvedValue(makeSession({ id: "old", status: "running" }));
    await service.start(asDb, TZ, { type: "focus" });
    // First updateSession call abandons the old session.
    const firstArg = h.updateSession.mock.calls[0]?.[1];
    expect(firstArg.status).toBe("abandoned");
    expect(h.insertSession).toHaveBeenCalledOnce();
  });

  it("moves a not-started anchored task to in_progress (EXECUTE seam)", async () => {
    h.insertSession.mockImplementation((_db, s) => Promise.resolve({ ...s, taskId: "t1" }));
    await service.start(asDb, TZ, { taskId: "t1", type: "deep_work" });
    expect(taskSvc.get).toHaveBeenCalledWith(asDb, "t1");
    expect(taskSvc.update).toHaveBeenCalledWith(asDb, { id: "t1", status: "in_progress" });
  });

  it("leaves an already in-progress task untouched", async () => {
    taskSvc.get.mockResolvedValue({ id: "t1", status: "in_progress", actualMinutes: 10 });
    h.insertSession.mockImplementation((_db, s) => Promise.resolve({ ...s, taskId: "t1" }));
    await service.start(asDb, TZ, { taskId: "t1", type: "deep_work" });
    expect(taskSvc.update).not.toHaveBeenCalled();
  });

  it("never lets a task-update failure break session start", async () => {
    taskSvc.get.mockRejectedValue(new Error("task gone"));
    h.insertSession.mockImplementation((_db, s) => Promise.resolve({ ...s, taskId: "t1" }));
    const s = await service.start(asDb, TZ, { taskId: "t1", type: "deep_work" });
    expect(s.status).toBe("running");
  });

  it("does not touch any task when the session is unanchored", async () => {
    await service.start(asDb, TZ, { type: "focus" });
    expect(taskSvc.get).not.toHaveBeenCalled();
  });
});

describe("FocusService transitions", () => {
  it("pause sets paused status", async () => {
    const s = await service.pause(asDb, TZ, "s1");
    expect(s.status).toBe("paused");
  });

  it("resume closes open breaks and resumes", async () => {
    h.getById.mockResolvedValue(
      makeSession({ status: "paused", pausedAt: "2026-07-11T09:00:00Z" }),
    );
    const s = await service.resume(asDb, TZ, "s1");
    expect(h.closeOpenBreaks).toHaveBeenCalledWith(db, "s1", expect.any(Date));
    expect(s.status).toBe("running");
  });

  it("complete marks the linked planner block complete (execution only)", async () => {
    h.getById.mockResolvedValue(makeSession({ status: "running", plannerBlockId: "blk-1" }));
    const s = await service.complete(asDb, TZ, "s1", 60);
    expect(s.status).toBe("completed");
    expect(s.energyAfter).toBe(60);
    expect(db.update).toHaveBeenCalled(); // planner block execution update
    expect(h.persistDailySummary).toHaveBeenCalled();
  });

  it("complete does not touch the planner when unlinked", async () => {
    h.getById.mockResolvedValue(makeSession({ status: "running", plannerBlockId: null }));
    await service.complete(asDb, TZ, "s1");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("complete credits focused minutes back to the anchored task", async () => {
    taskSvc.get.mockResolvedValue({ id: "t1", status: "in_progress", actualMinutes: 5 });
    h.getById.mockResolvedValue(
      makeSession({
        status: "running",
        taskId: "t1",
        startedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
      }),
    );
    await service.complete(asDb, TZ, "s1");
    expect(taskSvc.get).toHaveBeenCalledWith(asDb, "t1");
    const [, patch] = taskSvc.update.mock.calls[0] ?? [];
    expect(patch.id).toBe("t1");
    expect(patch.actualMinutes).toBeGreaterThan(5);
  });

  it("complete leaves tasks alone when the session is unanchored", async () => {
    h.getById.mockResolvedValue(makeSession({ status: "running", taskId: null }));
    await service.complete(asDb, TZ, "s1");
    expect(taskSvc.update).not.toHaveBeenCalled();
  });

  it("cancel ends without completion", async () => {
    const s = await service.cancel(asDb, TZ, "s1");
    expect(s.status).toBe("cancelled");
    expect(s.completed).toBe(false);
  });

  it("abandon ends without completion", async () => {
    const s = await service.abandon(asDb, TZ, "s1");
    expect(s.status).toBe("abandoned");
  });
});

describe("FocusService break + interruptions", () => {
  it("beginBreak inserts a break record", async () => {
    h.getById.mockResolvedValue(
      makeSession({ status: "running", startedAt: "2026-07-11T09:00:00Z" }),
    );
    const s = await service.beginBreak(asDb, TZ, "s1");
    expect(h.insertBreak).toHaveBeenCalledOnce();
    expect(s.status).toBe("break");
  });

  it("addInterruption inserts and appends", async () => {
    const s = await service.addInterruption(asDb, TZ, "s1", "phone", "call");
    expect(h.insertInterruption).toHaveBeenCalledOnce();
    expect(s.interruptions.length).toBeGreaterThan(0);
  });

  it("switchTask retargets the session", async () => {
    const s = await service.switchTask(asDb, TZ, "s1", { taskId: "t2" });
    expect(s.taskId).toBe("t2");
  });
});

describe("FocusService reads", () => {
  it("history delegates to the repository", async () => {
    h.history.mockResolvedValue([makeSession({ status: "completed" })]);
    const rows = await service.history(asDb, 10);
    expect(h.history).toHaveBeenCalledWith(asDb, 10);
    expect(rows).toHaveLength(1);
  });

  it("listToday delegates to the repository by date", async () => {
    h.listByDate.mockResolvedValue([makeSession({ status: "running" })]);
    const rows = await service.listToday(asDb, TZ);
    expect(rows).toHaveLength(1);
  });

  it("active returns the current session", async () => {
    h.getActive.mockResolvedValue(makeSession({ status: "running" }));
    const s = await service.active(asDb);
    expect(s?.status).toBe("running");
  });
});

describe("FocusService.recommendations", () => {
  it("returns recommendations for an active session", async () => {
    h.getActive.mockResolvedValue(
      makeSession({ status: "running", startedAt: "2026-07-11T09:00:00Z" }),
    );
    const recs = await service.recommendations(asDb, TZ);
    expect(Array.isArray(recs)).toBe(true);
    expect(recs.length).toBeGreaterThan(0);
  });

  it("suggests starting when idle", async () => {
    h.getActive.mockResolvedValue(null);
    const recs = await service.recommendations(asDb, TZ);
    expect(recs[0]?.id).toMatch(/start/);
  });
});
