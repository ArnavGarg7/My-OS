import { describe, expect, it } from "vitest";
import { assembleMorningBriefing } from "./assembler";
import { at, makeFocus, makeInput, makeState } from "./fixtures";

describe("assembleMorningBriefing", () => {
  it("produces every briefing section", () => {
    const b = assembleMorningBriefing(makeInput());
    const keys = [
      "greeting",
      "sleep",
      "energy",
      "mission",
      "nextAction",
      "focus",
      "remainingDay",
      "calendar",
      "workout",
      "weather",
      "yesterday",
      "notifications",
      "recommendation",
      "closing",
    ];
    for (const key of keys) expect(b).toHaveProperty(key);
  });

  it("assembles a coherent briefing for an empty day", () => {
    const b = assembleMorningBriefing(makeInput({ now: at(10) }));
    expect(b.greeting.salutation).toBe("Good Morning");
    expect(b.mission.mission).toBeNull();
    expect(b.recommendation.decision).toBe("You have no mission set.");
    expect(b.remainingDay.remainingMinutes).toBe(480);
    expect(b.closing.message).toBe("Have a productive day.");
  });

  it("reflects a defined day (all-set path)", () => {
    const b = assembleMorningBriefing(
      makeInput({
        now: at(10),
        focus: makeFocus({ mission: "Ship the release", deepWork: "Backend" }),
        state: makeState({
          energyLevel: "high",
          focusScore: 82,
          morningCompleted: true,
          wakeTime: "06:30",
        }),
      }),
    );
    expect(b.mission.mission).toBe("Ship the release");
    expect(b.nextAction.action).toBe("Backend");
    expect(b.focus.score).toBe(82);
    expect(b.energy.mode).toBe("Deep Focus");
    expect(b.recommendation.id).toBe("all-set");
  });

  it("carries a recommendation with decision/reason/confidence", () => {
    const rec = assembleMorningBriefing(makeInput()).recommendation;
    expect(typeof rec.decision).toBe("string");
    expect(typeof rec.reason).toBe("string");
    expect(rec.confidence).toBeGreaterThanOrEqual(0);
    expect(rec.confidence).toBeLessThanOrEqual(100);
  });

  it("flows notification counts into the briefing", () => {
    const b = assembleMorningBriefing(
      makeInput({ counts: { unreadInbox: 3, pendingDecisions: 2, pendingNotes: 5 } }),
    );
    expect(b.notifications).toEqual({ unreadInbox: 3, pendingDecisions: 2, pendingNotes: 5 });
  });

  it("flows yesterday data into the briefing", () => {
    const b = assembleMorningBriefing(
      makeInput({ yesterday: { completed: 4, incomplete: 1, carriedForward: 2 } }),
    );
    expect(b.yesterday.hasData).toBe(true);
    expect(b.yesterday.completed).toBe(4);
  });

  it("keeps calendar/weather/workout as infrastructure placeholders", () => {
    const b = assembleMorningBriefing(makeInput());
    expect(b.calendar.events).toHaveLength(0);
    expect(b.weather.message).toMatch(/later/);
    expect(b.workout.planned).toBe(false);
  });

  it("nulls the name when blank", () => {
    expect(assembleMorningBriefing(makeInput({ name: "  " })).greeting.name).toBeNull();
  });

  it("reports the working window in the energy section", () => {
    expect(assembleMorningBriefing(makeInput()).energy.workingWindow).toBe("09:00 – 18:00");
  });
});
