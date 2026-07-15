import { describe, expect, it } from "vitest";
import { TaskEngine, taskEngine } from "./engine";
import { WH, at, makeTask } from "./fixtures";

const engine = new TaskEngine();

describe("create", () => {
  it("builds a not-started, unpersisted task with defaults", () => {
    const t = engine.create({ title: "  Write report  " }, at(9));
    expect(t.id).toBe("");
    expect(t.title).toBe("Write report");
    expect(t.status).toBe("not_started");
    expect(t.priority).toBe("medium");
    expect(t.labels).toEqual([]);
    expect(t.dependencies).toEqual([]);
  });
});

describe("validate", () => {
  it("flags an empty title", () => {
    expect(engine.validate(makeTask({ title: "" }))).toContain("Title is required.");
  });
  it("flags a negative estimate", () => {
    expect(engine.validate(makeTask({ estimatedMinutes: -5 }))).toContain(
      "Estimate cannot be negative.",
    );
  });
  it("flags a schedule whose end is before its start", () => {
    const t = makeTask({
      scheduledStart: at(11).toISOString(),
      scheduledEnd: at(10).toISOString(),
    });
    expect(engine.validate(t)).toContain("Scheduled end must be after start.");
  });
  it("passes a well-formed task", () => {
    expect(engine.validate(makeTask())).toEqual([]);
  });
});

describe("lifecycle transitions", () => {
  it("start → in_progress", () => {
    expect(engine.start(makeTask(), at(10)).status).toBe("in_progress");
  });
  it("block → blocked, unblock → in_progress", () => {
    const blocked = engine.block(makeTask(), at(10));
    expect(blocked.status).toBe("blocked");
    expect(engine.unblock(blocked, at(11)).status).toBe("in_progress");
  });
  it("complete sets status + completedAt", () => {
    const done = engine.complete(makeTask(), at(12));
    expect(done.status).toBe("completed");
    expect(done.completedAt).toBe(at(12).toISOString());
  });
  it("archive → archived", () => {
    expect(engine.archive(makeTask(), at(12)).status).toBe("archived");
  });
});

describe("update", () => {
  it("patches provided fields and trims text", () => {
    const t = engine.update(makeTask(), { title: "  New  ", priority: "high" }, at(10));
    expect(t.title).toBe("New");
    expect(t.priority).toBe("high");
  });
});

describe("schedule", () => {
  it("applies the recommended slot to the task", () => {
    const { task, result } = engine.schedule({
      task: makeTask({ estimatedMinutes: 60 }),
      workingHours: WH,
      existing: [],
      now: at(10),
    });
    expect(task.scheduledStart).toBe(result.recommendedStart);
    expect(new Date(task.scheduledStart!).getHours()).toBe(10);
  });
});

describe("generateNextOccurrence", () => {
  it("clones the task with the next due date", () => {
    const t = makeTask({ dueAt: new Date("2026-07-07T10:00:00.000Z").toISOString() });
    const next = engine.generateNextOccurrence(t, { frequency: "weekly", interval: 1 }, at(13));
    expect(next.id).toBe("");
    expect(next.dueAt).toBe("2026-07-14T10:00:00.000Z");
    expect(next.status).toBe("not_started");
  });
});

describe("singleton", () => {
  it("exposes a shared stateless engine", () => {
    expect(taskEngine).toBeInstanceOf(TaskEngine);
  });
});
