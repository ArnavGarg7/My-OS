import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  saveRun: vi.fn(),
  listRuns: vi.fn(),
  getRun: vi.fn(),
  listFailures: vi.fn(),
  executePlan: vi.fn(),
  timelineRecord: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => ({
  saveRun: h.saveRun,
  listRuns: h.listRuns,
  getRun: h.getRun,
  listFailures: h.listFailures,
}));
vi.mock("./executor", () => ({ executePlan: h.executePlan }));
vi.mock("../timeline/service", () => ({ record: h.timelineRecord }));

import { failures, history, preview, run } from "./service";
import { makeRun } from "@myos/core/orchestration";

const db = {} as never;
const prefs = { preferredStartOfDay: "09:00", preferredEndOfDay: "17:00" };

beforeEach(() => {
  vi.clearAllMocks();
  h.executePlan.mockResolvedValue({ steps: [], failures: [], recoveries: [] });
  h.saveRun.mockImplementation((_db, r) => Promise.resolve(r));
  h.timelineRecord.mockResolvedValue({});
});

describe("orchestration service.run", () => {
  it("resolves a known event to a pipeline, executes it and persists the run", async () => {
    const result = await run(db, "UTC", prefs, "calendar.meeting_added", "manual");
    expect(result).not.toBeNull();
    expect(result!.pipeline).toBe("calendar");
    expect(h.executePlan).toHaveBeenCalledOnce();
    expect(h.saveRun).toHaveBeenCalledOnce();
  });

  it("records the run to the timeline as orchestration.completed on success", async () => {
    await run(db, "UTC", prefs, "calendar.meeting_added");
    expect(h.timelineRecord).toHaveBeenCalledOnce();
    const arg = h.timelineRecord.mock.calls[0]![1];
    expect(arg.eventType).toBe("orchestration.completed");
    expect(arg.source).toBe("orchestration");
  });

  it("records orchestration.failed when a step fails hard", async () => {
    h.executePlan.mockResolvedValue({
      steps: [{ module: "planner", outcome: "failed", mode: "regenerate", runtimeMs: 1 }],
      failures: [{ module: "planner", error: "x", strategy: "abort", recovered: false }],
      recoveries: [],
    });
    await run(db, "UTC", prefs, "calendar.meeting_added");
    const arg = h.timelineRecord.mock.calls[0]![1];
    expect(arg.eventType).toBe("orchestration.failed");
  });

  it("returns null for an event with no matching pipeline", async () => {
    const result = await run(db, "UTC", prefs, "totally.unknown.event");
    expect(result).toBeNull();
    expect(h.executePlan).not.toHaveBeenCalled();
    expect(h.saveRun).not.toHaveBeenCalled();
  });

  it("does not throw if timeline recording fails", async () => {
    h.timelineRecord.mockRejectedValue(new Error("timeline down"));
    await expect(run(db, "UTC", prefs, "calendar.meeting_added")).resolves.not.toBeNull();
  });
});

describe("orchestration service reads", () => {
  it("preview builds a plan without executing or persisting", () => {
    const plan = preview("calendar.meeting_added");
    expect(plan).not.toBeNull();
    expect(plan!.pipeline).toBe("calendar");
    expect(h.executePlan).not.toHaveBeenCalled();
    expect(h.saveRun).not.toHaveBeenCalled();
  });

  it("preview returns null for an unknown event", () => {
    expect(preview("totally.unknown.event")).toBeNull();
  });

  it("history delegates to the repository", async () => {
    h.listRuns.mockResolvedValue([makeRun()]);
    const rows = await history(db, undefined, 10);
    expect(rows).toHaveLength(1);
    expect(h.listRuns).toHaveBeenCalledWith(db, undefined, 10);
  });

  it("failures delegates to the repository", async () => {
    h.listFailures.mockResolvedValue([]);
    await failures(db, 25);
    expect(h.listFailures).toHaveBeenCalledWith(db, 25);
  });

  it("defaults the trigger source to manual", async () => {
    await run(db, "UTC", prefs, "calendar.meeting_added");
    const saved = h.saveRun.mock.calls[0]![1];
    expect(saved.source).toBe("manual");
  });

  it("passes failures + recoveries from the executor to saveRun", async () => {
    h.executePlan.mockResolvedValue({
      steps: [{ module: "planner", outcome: "recovered", mode: "regenerate", runtimeMs: 1 }],
      failures: [{ module: "planner", error: "x", strategy: "retry_step", recovered: true }],
      recoveries: [{ module: "planner", strategy: "retry_step", skip: [], reason: "retry" }],
    });
    await run(db, "UTC", prefs, "calendar.meeting_added");
    const [, , savedFailures, savedRecoveries] = h.saveRun.mock.calls[0]!;
    expect(savedFailures).toHaveLength(1);
    expect(savedRecoveries).toHaveLength(1);
  });

  it("records orchestration.recovered when the run recovered", async () => {
    h.executePlan.mockResolvedValue({
      steps: [{ module: "planner", outcome: "recovered", mode: "regenerate", runtimeMs: 1 }],
      failures: [],
      recoveries: [],
    });
    await run(db, "UTC", prefs, "calendar.meeting_added");
    const arg = h.timelineRecord.mock.calls[0]![1];
    expect(arg.eventType).toBe("orchestration.recovered");
  });
});
