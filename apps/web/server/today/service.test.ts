import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DailyStateRow } from "@myos/db/schema";

// TodayService is server-only; mock the DB boundary (repository) and verify the
// orchestration + row→DTO mapping + focus-score recalculation.
const h = vi.hoisted(() => ({
  ensureDay: vi.fn(),
  getState: vi.fn(),
  upsertState: vi.fn(),
  getFocus: vi.fn(),
  upsertFocus: vi.fn(),
  getMetrics: vi.fn(),
  upsertMetrics: vi.fn(),
  addNote: vi.fn(),
  listNotes: vi.fn(),
  listDecisions: vi.fn(),
  findDecisionByText: vi.fn(),
  countPendingDecisions: vi.fn(),
  countNotes: vi.fn(),
  addDecision: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => h);

import * as service from "./service";

const db = {} as never;
const TZ = "Asia/Kolkata";
const DAY = "2026-07-06";

function stateRow(over: Partial<DailyStateRow> = {}): DailyStateRow {
  return {
    date: DAY,
    wakeTime: null,
    sleepTarget: null,
    energyLevel: null,
    focusScore: null,
    currentBlock: null,
    currentActivity: null,
    status: "idle",
    morningCompleted: false,
    morningCompletedAt: null,
    eveningCompleted: false,
    lastRecalculatedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}

beforeEach(() => vi.clearAllMocks());

describe("getState", () => {
  it("returns an empty state when no row exists", async () => {
    h.getState.mockResolvedValue(undefined);
    const result = await service.getState(db, TZ, DAY);
    expect(result.date).toBe(DAY);
    expect(result.status).toBe("idle");
    expect(result.focusScore).toBeNull();
  });

  it("maps a row (timestamps → ISO strings)", async () => {
    const recalculated = new Date("2026-07-06T05:00:00Z");
    h.getState.mockResolvedValue(stateRow({ focusScore: 72, lastRecalculatedAt: recalculated }));
    const result = await service.getState(db, TZ, DAY);
    expect(result.focusScore).toBe(72);
    expect(result.lastRecalculatedAt).toBe(recalculated.toISOString());
  });
});

describe("updateState", () => {
  it("strips date and upserts the patch", async () => {
    h.upsertState.mockResolvedValue(stateRow({ status: "active" }));
    const result = await service.updateState(db, TZ, { date: DAY, status: "active" });
    expect(result.status).toBe("active");
    expect(h.upsertState).toHaveBeenCalledWith(db, DAY, { status: "active" });
  });
});

describe("updateMetrics", () => {
  it("recomputes and persists the focus score from the metrics", async () => {
    h.upsertMetrics.mockResolvedValue({
      date: DAY,
      completedTasks: 8,
      deepWorkMinutes: 120,
      meetings: 0,
      interruptions: 0,
      focusSwitches: 0,
      plannerAccuracy: null,
      energyEntries: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    h.upsertState.mockResolvedValue(stateRow());

    const result = await service.updateMetrics(db, TZ, {
      date: DAY,
      completedTasks: 8,
      deepWorkMinutes: 120,
    });

    expect(result.completedTasks).toBe(8);
    expect(h.ensureDay).toHaveBeenCalledWith(db, DAY);
    // full deep work + tasks, no penalties → 100
    expect(h.upsertState).toHaveBeenCalledWith(
      db,
      DAY,
      expect.objectContaining({ focusScore: 100, lastRecalculatedAt: expect.any(Date) }),
    );
  });
});

describe("addNote", () => {
  it("ensures the day then inserts the note", async () => {
    h.addNote.mockResolvedValue({
      id: "n1",
      date: DAY,
      timestamp: new Date("2026-07-06T06:00:00Z"),
      content: "hello",
      type: "note",
      createdAt: new Date(),
    });
    const note = await service.addNote(db, TZ, { content: "hello", type: "note", date: DAY });
    expect(h.ensureDay).toHaveBeenCalledWith(db, DAY);
    expect(h.addNote).toHaveBeenCalledWith(db, { date: DAY, content: "hello", type: "note" });
    expect(note.timestamp).toBe("2026-07-06T06:00:00.000Z");
  });
});

describe("completeMorning", () => {
  it("marks the day complete with a timestamp", async () => {
    h.upsertState.mockResolvedValue(stateRow({ morningCompleted: true }));
    const result = await service.completeMorning(db, TZ, DAY);
    expect(result.morningCompleted).toBe(true);
    expect(h.upsertState).toHaveBeenCalledWith(
      db,
      DAY,
      expect.objectContaining({ morningCompleted: true, morningCompletedAt: expect.any(Date) }),
    );
  });
});

describe("logRecommendation", () => {
  const prefs = { displayName: "Arnav", preferredStartOfDay: "09:00", preferredEndOfDay: "18:00" };

  beforeEach(() => {
    h.getState.mockResolvedValue(stateRow());
    h.getFocus.mockResolvedValue(undefined);
    h.getMetrics.mockResolvedValue(undefined);
    h.countPendingDecisions.mockResolvedValue(0);
    h.countNotes.mockResolvedValue(0);
  });

  it("logs the recommendation into decision_history when new", async () => {
    h.findDecisionByText.mockResolvedValue(undefined);
    h.addDecision.mockResolvedValue({});
    const result = await service.logRecommendation(db, TZ, prefs);
    expect(result.logged).toBe(true);
    expect(h.addDecision).toHaveBeenCalledTimes(1);
    expect(typeof result.decision).toBe("string");
  });

  it("does not duplicate an already-logged recommendation", async () => {
    h.findDecisionByText.mockResolvedValue({ id: "d1" });
    const result = await service.logRecommendation(db, TZ, prefs);
    expect(result.logged).toBe(false);
    expect(h.addDecision).not.toHaveBeenCalled();
  });
});

describe("listNotes / getDecisionHistory", () => {
  it("maps note + decision rows to DTOs", async () => {
    h.listNotes.mockResolvedValue([
      {
        id: "n1",
        date: DAY,
        timestamp: new Date("2026-07-06T06:00:00Z"),
        content: "c",
        type: "thought",
        createdAt: new Date(),
      },
    ]);
    h.listDecisions.mockResolvedValue([
      {
        id: "d1",
        date: DAY,
        decision: "Do X",
        reason: null,
        confidence: null,
        accepted: false,
        dismissed: false,
        timestamp: new Date("2026-07-06T07:00:00Z"),
        createdAt: new Date(),
      },
    ]);
    const notes = await service.listNotes(db, TZ, DAY);
    const decisions = await service.getDecisionHistory(db, TZ, { date: DAY });
    expect(notes[0]?.type).toBe("thought");
    expect(decisions[0]?.decision).toBe("Do X");
    expect(h.listDecisions).toHaveBeenCalledWith(db, DAY, 50);
  });
});
