import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  breakRowToDomain,
  interruptionRowToDomain,
  sessionRowToDomain,
  sessionToColumns,
} from "./mapper";
import type { FocusBreakRow, FocusInterruptionRow, FocusSessionRow } from "@myos/db/schema";
import { makeSession } from "@myos/core/focus";

const sessionRow: FocusSessionRow = {
  id: "s1",
  taskId: "t1",
  plannerBlockId: "b1",
  projectId: "p1",
  type: "deep_work",
  status: "running",
  startedAt: new Date("2026-07-11T09:00:00Z"),
  endedAt: null,
  pausedDurationMs: 60000,
  pausedAt: null,
  plannedMinutes: 50,
  notes: "hi",
  completed: false,
  energyBefore: 70,
  energyAfter: null,
  sessionDate: "2026-07-11",
  createdAt: new Date("2026-07-11T09:00:00Z"),
  updatedAt: new Date("2026-07-11T09:00:00Z"),
};

const intRow: FocusInterruptionRow = {
  id: "i1",
  sessionId: "s1",
  type: "phone",
  note: "call",
  at: new Date("2026-07-11T09:10:00Z"),
};

const breakRow: FocusBreakRow = {
  id: "brk1",
  sessionId: "s1",
  type: "short",
  plannedMinutes: 10,
  startedAt: new Date("2026-07-11T09:50:00Z"),
  endedAt: new Date("2026-07-11T10:00:00Z"),
};

describe("focus mappers", () => {
  it("maps a session row to a domain session", () => {
    const s = sessionRowToDomain(sessionRow, [intRow], [breakRow]);
    expect(s.id).toBe("s1");
    expect(s.startedAt).toBe("2026-07-11T09:00:00.000Z");
    expect(s.endedAt).toBeNull();
    expect(s.interruptions).toHaveLength(1);
    expect(s.breaks).toHaveLength(1);
  });

  it("maps an interruption row with optional note", () => {
    expect(interruptionRowToDomain(intRow).note).toBe("call");
    expect(interruptionRowToDomain({ ...intRow, note: null }).note).toBeUndefined();
  });

  it("maps a break row and null endedAt", () => {
    expect(breakRowToDomain(breakRow).endedAt).toBe("2026-07-11T10:00:00.000Z");
    expect(breakRowToDomain({ ...breakRow, endedAt: null }).endedAt).toBeNull();
  });

  it("sessionToColumns converts ISO strings back to Dates", () => {
    const cols = sessionToColumns(makeSession({ startedAt: "2026-07-11T09:00:00Z" }), "2026-07-11");
    expect(cols.startedAt).toBeInstanceOf(Date);
    expect(cols.sessionDate).toBe("2026-07-11");
    expect(cols.updatedAt).toBeInstanceOf(Date);
  });

  it("round-trips a session through columns and back", () => {
    const domain = sessionRowToDomain(sessionRow, [], []);
    const cols = sessionToColumns(domain, "2026-07-11");
    expect(cols.type).toBe("deep_work");
    expect(cols.pausedDurationMs).toBe(60000);
  });
});
