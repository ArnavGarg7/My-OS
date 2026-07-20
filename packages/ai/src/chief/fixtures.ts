/**
 * Deterministic test fixtures for the Chief (Sprint 5.2). A canonical `ChiefContext` builder with
 * a fixed clock so every test is reproducible. Not part of the public API — imported by tests only.
 */
import { defaultProfile } from "./profile";
import type { ChiefContext } from "./types";

export const FIXED_NOW = "2026-07-18T10:00:00.000Z";

export function makeContext(over: Partial<ChiefContext> = {}): ChiefContext {
  return {
    now: FIXED_NOW,
    timezone: "Asia/Kolkata",
    greetingName: "Arnav",
    readiness: 83,
    energy: "high",
    mission: {
      title: "Ship the Chief of Staff",
      priorities: [
        { rank: 1, label: "Finish AI Chief of Staff backend", ref: { module: "task", id: "t1" } },
        { rank: 2, label: "Internship meeting (3 PM)" },
        { rank: 3, label: "Gym" },
      ],
    },
    focusWindows: [
      {
        start: "2026-07-18T10:00:00.000Z",
        end: "2026-07-18T12:00:00.000Z",
        minutes: 120,
        uninterrupted: true,
      },
    ],
    planBlocks: [],
    calendarEvents: [
      {
        id: "e1",
        title: "Internship meeting",
        start: "2026-07-18T15:00:00.000Z",
        end: "2026-07-18T16:00:00.000Z",
      },
    ],
    tasks: [
      {
        id: "t1",
        title: "Finish Chief backend",
        score: 42,
        dueAt: "2026-07-19T00:00:00.000Z",
        estimateMin: 120,
        area: "work",
        status: "todo",
      },
      { id: "t2", title: "Review PR", score: 20, estimateMin: 30, status: "todo" },
      { id: "t3", title: "Email replies", score: 10, estimateMin: 15, status: "todo" },
    ],
    goals: [{ id: "g1", title: "Ship My OS", progress: 60, staleDays: 0 }],
    activeFocusSession: null,
    pendingDecisions: 0,
    disruptions: [],
    profile: defaultProfile(),
    ...over,
  };
}
