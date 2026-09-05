import { describe, expect, it } from "vitest";
import {
  parseIntent,
  advance,
  startState,
  phaseMinutes,
  interventionSpeech,
  DEFAULT_POMODORO,
  type PomodoroConfig,
} from "./index";

/**
 * Interaction (Stage 9). Deterministic NL parsing (cost discipline — no AI for these) and
 * deterministic Pomodoro phase sequencing over the real Focus engine.
 */
const now = new Date("2026-09-05T09:00:00.000Z");

describe("deterministic intent parsing", () => {
  it("creates a task from an explicit verb + reuses the task parser (date/duration)", () => {
    const i = parseIntent("add finish internship report tomorrow 2h", now);
    expect(i?.kind).toBe("create_task");
    if (i?.kind === "create_task") {
      expect(i.title.toLowerCase()).toContain("finish internship report");
      expect(i.dueAt).not.toBeNull();
      expect(i.estimatedMinutes).toBe(120);
    }
  });
  it("starts focus with duration + task query", () => {
    const i = parseIntent("start a 50 minute focus session on my OS project", now);
    expect(i?.kind).toBe("start_focus");
    if (i?.kind === "start_focus") {
      expect(i.durationMinutes).toBe(50);
      expect(i.taskQuery?.toLowerCase()).toContain("os project");
    }
  });
  it("recognises recommend / workload / weather / calendar", () => {
    expect(parseIntent("what should I work on?", now)?.kind).toBe("recommend");
    expect(parseIntent("is my day overloaded", now)?.kind).toBe("workload");
    expect(parseIntent("what's the weather tomorrow", now)).toEqual({
      kind: "weather",
      when: "tomorrow",
    });
    expect(parseIntent("show my meetings tomorrow", now)).toEqual({
      kind: "query_calendar",
      range: "tomorrow",
    });
  });
  it("captures to inbox", () => {
    expect(parseIntent("capture call the dentist", now)).toEqual({
      kind: "capture_inbox",
      content: "call the dentist",
    });
  });
  it("returns null for phrasings it doesn't confidently match (→ AI fallback)", () => {
    expect(parseIntent("hmm maybe later i guess", now)).toBeNull();
  });
});

describe("pomodoro phase sequencing (over real Focus)", () => {
  const cfg: PomodoroConfig = { ...DEFAULT_POMODORO, cyclesBeforeLongBreak: 4 };
  it("work → short break → work, long break every 4th cycle", () => {
    let s = startState();
    expect(s.phase).toBe("work");
    s = advance(s, cfg); // after 1st work
    expect(s.phase).toBe("short_break");
    expect(s.completedWorkCycles).toBe(1);
    s = advance(s, cfg); // after break
    expect(s.phase).toBe("work");
    // complete 3 more work cycles → 4th triggers long break
    s = advance(s, cfg); // work#2 done → short
    s = advance(s, cfg); // break → work
    s = advance(s, cfg); // work#3 done → short
    s = advance(s, cfg); // break → work
    s = advance(s, cfg); // work#4 done → long break
    expect(s.completedWorkCycles).toBe(4);
    expect(s.phase).toBe("long_break");
  });
  it("phase durations come from config", () => {
    expect(phaseMinutes("work", cfg)).toBe(25);
    expect(phaseMinutes("short_break", cfg)).toBe(5);
    expect(phaseMinutes("long_break", cfg)).toBe(15);
  });
});

describe("proactive → voice seam", () => {
  it("phrases an intervention with its action as a question", () => {
    const v = interventionSpeech({
      title: "Free focus window",
      reason: "You have 90 uninterrupted minutes.",
      action: { kind: "focus", label: "Start Deep Work" },
    });
    expect(v.utterance).toContain("Free focus window");
    expect(v.utterance).toContain("Want me to start deep work?");
    expect(v.action).toEqual({ kind: "focus", label: "Start Deep Work" });
  });
  it("omits the ask when there is no action", () => {
    const v = interventionSpeech({ title: "Inbox needs processing", action: null });
    expect(v.utterance).not.toContain("Want me to");
    expect(v.action).toBeNull();
  });
});
