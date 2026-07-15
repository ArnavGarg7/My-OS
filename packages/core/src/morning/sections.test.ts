import { describe, expect, it } from "vitest";
import {
  buildCalendar,
  buildClosing,
  buildEnergy,
  buildFocus,
  buildGreeting,
  buildMission,
  buildNextAction,
  buildNotifications,
  buildRemainingDay,
  buildSleep,
  buildWeather,
  buildWorkout,
  buildYesterday,
} from "./sections";
import { at, makeContext, makeFocus, makeMetrics, makeState } from "./fixtures";

describe("buildGreeting", () => {
  it("salutation follows the phase", () => {
    expect(buildGreeting(makeContext({ now: at(8) })).salutation).toBe("Good Morning");
    expect(buildGreeting(makeContext({ now: at(14) })).salutation).toBe("Good Afternoon");
    expect(buildGreeting(makeContext({ now: at(19) })).salutation).toBe("Good Evening");
  });
  it("includes the name and a subtitle", () => {
    const g = buildGreeting(makeContext({ name: "Arnav" }));
    expect(g.name).toBe("Arnav");
    expect(g.subtitle).toBe("Here's today's operating briefing.");
  });
  it("formats a date + time label", () => {
    const g = buildGreeting(makeContext());
    expect(g.dateLabel).toMatch(/\w+,\s\w+\s\d+/);
    expect(g.timeLabel).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
  });
  it("nulls a blank name", () => {
    expect(buildGreeting(makeContext({ name: "  " })).name).toBeNull();
  });
});

describe("buildSleep", () => {
  it("has no data without a wake time", () => {
    const s = buildSleep(makeContext());
    expect(s.hasData).toBe(false);
    expect(s.durationMinutes).toBeNull();
  });
  it("computes duration from bedtime + wake time (overnight)", () => {
    const s = buildSleep(
      makeContext({ state: makeState({ sleepTarget: "23:00", wakeTime: "07:00" }) }),
    );
    expect(s.hasData).toBe(true);
    expect(s.durationMinutes).toBe(480); // 8h
  });
  it("leaves duration null when only a wake time is present", () => {
    const s = buildSleep(makeContext({ state: makeState({ wakeTime: "07:00" }) }));
    expect(s.hasData).toBe(true);
    expect(s.durationMinutes).toBeNull();
  });
});

describe("greeting salutation edge", () => {
  it("late night still reads Good Evening", () => {
    expect(buildGreeting(makeContext({ now: at(23) })).salutation).toBe("Good Evening");
  });
});

describe("focus reasons without a score", () => {
  it("still surfaces reasons", () => {
    const f = buildFocus(makeContext());
    expect(f.score).toBeNull();
    expect(f.reasons.length).toBeGreaterThan(0);
  });
});

describe("next action fallback", () => {
  it("ignores whitespace-only fields", () => {
    expect(
      buildNextAction(makeContext({ focus: makeFocus({ priority: "   ", mission: "M" }) })).action,
    ).toBe("Start: M");
  });
});

describe("buildEnergy", () => {
  it("maps energy to a mode", () => {
    expect(buildEnergy(makeContext({ state: makeState({ energyLevel: "low" }) })).mode).toBe(
      "Recovery",
    );
    expect(buildEnergy(makeContext({ state: makeState({ energyLevel: "medium" }) })).mode).toBe(
      "Steady",
    );
    expect(buildEnergy(makeContext({ state: makeState({ energyLevel: "high" }) })).mode).toBe(
      "Deep Focus",
    );
    expect(buildEnergy(makeContext()).mode).toBe("Undefined");
  });
  it("shows the working window", () => {
    expect(buildEnergy(makeContext()).workingWindow).toBe("09:00 – 18:00");
  });
});

describe("buildMission", () => {
  it("returns the mission or null", () => {
    expect(buildMission(makeContext({ focus: makeFocus({ mission: "Ship 2.2" }) })).mission).toBe(
      "Ship 2.2",
    );
    expect(buildMission(makeContext()).mission).toBeNull();
  });
});

describe("buildNextAction", () => {
  it("prefers priority, then deep work, then mission, then a fallback", () => {
    expect(
      buildNextAction(
        makeContext({ focus: makeFocus({ priority: "Reviews", deepWork: "X", mission: "M" }) }),
      ).action,
    ).toBe("Reviews");
    expect(
      buildNextAction(makeContext({ focus: makeFocus({ deepWork: "Backend", mission: "M" }) }))
        .action,
    ).toBe("Backend");
    expect(buildNextAction(makeContext({ focus: makeFocus({ mission: "M" }) })).action).toBe(
      "Start: M",
    );
    expect(buildNextAction(makeContext()).action).toBe("Set your mission for today.");
  });
});

describe("buildFocus", () => {
  it("carries the stored score", () => {
    expect(buildFocus(makeContext({ state: makeState({ focusScore: 82 }) })).score).toBe(82);
  });
  it("produces positive + negative reasons", () => {
    const f = buildFocus(
      makeContext({
        state: makeState({ wakeTime: null }),
        focus: makeFocus({ mission: "M", deepWork: "D" }),
        metrics: makeMetrics({ interruptions: 8 }),
      }),
    );
    const texts = f.reasons.map((r) => r.text);
    expect(texts).toContain("Deep work scheduled");
    expect(texts).toContain("No wake time logged");
    expect(f.reasons.some((r) => r.positive)).toBe(true);
    expect(f.reasons.some((r) => !r.positive)).toBe(true);
  });
  it("flags a missing mission", () => {
    expect(buildFocus(makeContext()).reasons.some((r) => r.text === "No mission set")).toBe(true);
  });
});

describe("infrastructure sections", () => {
  it("calendar is empty", () => {
    expect(buildCalendar(makeContext())).toEqual({ events: [], message: "No events scheduled." });
  });
  it("workout is a placeholder", () => {
    expect(buildWorkout(makeContext()).message).toBe("No workout planned.");
  });
  it("weather is a placeholder", () => {
    expect(buildWeather(makeContext()).message).toMatch(/later/);
  });
  it("yesterday reflects provided data", () => {
    expect(buildYesterday(makeContext()).hasData).toBe(false);
    const y = buildYesterday(
      makeContext({ yesterday: { completed: 3, incomplete: 1, carriedForward: 2 } }),
    );
    expect(y).toEqual({ hasData: true, completed: 3, incomplete: 1, carriedForward: 2 });
  });
  it("notifications reflect counts", () => {
    const n = buildNotifications(
      makeContext({ counts: { unreadInbox: 2, pendingDecisions: 1, pendingNotes: 4 } }),
    );
    expect(n).toEqual({ unreadInbox: 2, pendingDecisions: 1, pendingNotes: 4 });
  });
});

describe("buildRemainingDay", () => {
  it("derives from the snapshot", () => {
    const r = buildRemainingDay(makeContext({ now: at(10) }));
    expect(r.remainingMinutes).toBe(480);
    expect(r.phase).toBe("morning");
  });
});

describe("buildClosing", () => {
  it("varies by phase", () => {
    expect(buildClosing(makeContext({ now: at(8) })).message).toBe("Have a productive day.");
    expect(buildClosing(makeContext({ now: at(14) })).message).toMatch(/rest of the day/);
    expect(buildClosing(makeContext({ now: at(19) })).message).toMatch(/Finish strong/);
  });
});
