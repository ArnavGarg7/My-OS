import { describe, expect, it } from "vitest";
import { computeJournal } from "./journal";
import { makeEvents } from "./fixtures";

const input = {
  writingStreak: 5,
  wordCount: 1200,
  reflectionCount: 4,
  moodTrend: 4,
  gratitudeCount: 6,
};

describe("computeJournal", () => {
  it("counts entries from the Timeline + scores cadence/mood", () => {
    const m = computeJournal(makeEvents(), 7, input);
    expect(m.entries).toBe(1); // makeEvents has 1 journal.created
    expect(m.writingStreak).toBe(5);
    expect(m.moodTrend).toBe(4);
    expect(m.score).toBeGreaterThan(0);
  });
  it("rewards consistent reflection", () => {
    const strong = computeJournal(makeEvents(), 7, { ...input, reflectionCount: 5 });
    const weak = computeJournal(makeEvents(), 7, { ...input, reflectionCount: 0 });
    expect(strong.score).toBeGreaterThan(weak.score);
  });
  it("defaults gracefully without input", () => {
    const m = computeJournal([], 7);
    expect(m.entries).toBe(0);
    expect(m.moodTrend).toBe(3);
  });

  it("carries through word count + streak + gratitude", () => {
    const m = computeJournal([], 7, input);
    expect(m.wordCount).toBe(1200);
    expect(m.writingStreak).toBe(5);
    expect(m.gratitudeCount).toBe(6);
  });

  it("scores a higher mood above a lower one", () => {
    const happy = computeJournal([], 7, { ...input, moodTrend: 5 });
    const sad = computeJournal([], 7, { ...input, moodTrend: 1 });
    expect(happy.score).toBeGreaterThan(sad.score);
  });
});
