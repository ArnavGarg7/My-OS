import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeActionFixture } from "@myos/core/automation";

const h = vi.hoisted(() => ({
  notifGenerate: vi.fn(),
  focusActive: vi.fn(),
  focusStart: vi.fn(),
  focusPause: vi.fn(),
  focusResume: vi.fn(),
  focusComplete: vi.fn(),
  plannerGenerate: vi.fn(),
  decisionGenerate: vi.fn(),
  timelineRecord: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("../notification/service", () => ({ generate: h.notifGenerate }));
vi.mock("../focus/service", () => ({
  active: h.focusActive,
  start: h.focusStart,
  pause: h.focusPause,
  resume: h.focusResume,
  complete: h.focusComplete,
}));
vi.mock("../planner/service", () => ({ generate: h.plannerGenerate }));
vi.mock("../decision/service", () => ({ generate: h.decisionGenerate }));
vi.mock("../timeline/service", () => ({ record: h.timelineRecord }));

import { dispatchAction } from "./executor";

const ctx = {
  db: {} as never,
  tz: "UTC",
  prefs: { preferredStartOfDay: "09:00", preferredEndOfDay: "17:00" },
};

beforeEach(() => {
  vi.clearAllMocks();
  h.notifGenerate.mockResolvedValue({ created: 2, delivered: 1, suppressed: 0 });
  h.focusActive.mockResolvedValue({ id: "f1" });
  h.focusStart.mockResolvedValue({ id: "f1" });
  h.focusPause.mockResolvedValue({ id: "f1" });
  h.focusResume.mockResolvedValue({ id: "f1" });
  h.focusComplete.mockResolvedValue({ id: "f1" });
  h.plannerGenerate.mockResolvedValue({});
  h.decisionGenerate.mockResolvedValue([{ id: "d1" }]);
  h.timelineRecord.mockResolvedValue({});
});

describe("dispatchAction", () => {
  it("generate_notification calls the notification engine", async () => {
    const r = await dispatchAction(makeActionFixture({ kind: "generate_notification" }), ctx);
    expect(r.ok).toBe(true);
    expect(h.notifGenerate).toHaveBeenCalledWith(ctx.db, "UTC");
  });

  it("create_reminder also routes to the notification engine", async () => {
    const r = await dispatchAction(makeActionFixture({ kind: "create_reminder" }), ctx);
    expect(r.ok).toBe(true);
    expect(h.notifGenerate).toHaveBeenCalled();
  });

  it("start_focus starts a session", async () => {
    const r = await dispatchAction(
      makeActionFixture({ kind: "start_focus", params: { type: "deep_work" } }),
      ctx,
    );
    expect(r.ok).toBe(true);
    expect(h.focusStart).toHaveBeenCalled();
  });

  it("pause_focus pauses the active session", async () => {
    const r = await dispatchAction(makeActionFixture({ kind: "pause_focus" }), ctx);
    expect(r.ok).toBe(true);
    expect(h.focusPause).toHaveBeenCalledWith(ctx.db, "UTC", "f1");
  });

  it("pause_focus with no active session is a graceful no-op", async () => {
    h.focusActive.mockResolvedValue(null);
    const r = await dispatchAction(makeActionFixture({ kind: "pause_focus" }), ctx);
    expect(r.ok).toBe(true);
    expect(r.detail).toContain("no active");
    expect(h.focusPause).not.toHaveBeenCalled();
  });

  it("resume_focus resumes the active session", async () => {
    await dispatchAction(makeActionFixture({ kind: "resume_focus" }), ctx);
    expect(h.focusResume).toHaveBeenCalled();
  });

  it("complete_focus completes the active session", async () => {
    await dispatchAction(makeActionFixture({ kind: "complete_focus" }), ctx);
    expect(h.focusComplete).toHaveBeenCalled();
  });

  it("generate_planner + regenerate_planner call the planner", async () => {
    await dispatchAction(makeActionFixture({ kind: "generate_planner" }), ctx);
    await dispatchAction(makeActionFixture({ kind: "regenerate_planner" }), ctx);
    expect(h.plannerGenerate).toHaveBeenCalledTimes(2);
  });

  it("generate_decision calls the decision engine", async () => {
    const r = await dispatchAction(makeActionFixture({ kind: "generate_decision" }), ctx);
    expect(r.detail).toContain("decisions");
    expect(h.decisionGenerate).toHaveBeenCalled();
  });

  it("log_timeline_event records a timeline event", async () => {
    await dispatchAction(
      makeActionFixture({ kind: "log_timeline_event", params: { title: "x" } }),
      ctx,
    );
    expect(h.timelineRecord).toHaveBeenCalled();
  });

  it("noop succeeds", async () => {
    const r = await dispatchAction(makeActionFixture({ kind: "noop" }), ctx);
    expect(r.ok).toBe(true);
  });

  it("client-driven actions are acknowledged", async () => {
    const r = await dispatchAction(makeActionFixture({ kind: "open_tomorrow" }), ctx);
    expect(r.ok).toBe(true);
    expect(r.detail).toContain("acknowledged");
  });

  it("returns ok:false when a service throws", async () => {
    h.focusStart.mockRejectedValue(new Error("no task"));
    const r = await dispatchAction(makeActionFixture({ kind: "start_focus" }), ctx);
    expect(r.ok).toBe(false);
    expect(r.detail).toContain("no task");
  });
});
