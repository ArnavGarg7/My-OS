import { describe, expect, it } from "vitest";
import { at, makeEntry, makeReflection, makeReview } from "./fixtures";
import { journalEngine, type SummaryInput } from "./engine";

function input(over: Partial<SummaryInput> = {}): SummaryInput {
  return {
    date: "2026-07-07",
    entries: [makeEntry({ mood: "good", createdAt: at(2026, 6, 7) })],
    reflections: [makeReflection({ date: "2026-07-07" })],
    reviews: [makeReview()],
    ...over,
  };
}

describe("JournalEngine", () => {
  it("creates + validates an entry", () => {
    const e = journalEngine.create({ title: "Hi", content: "body" }, new Date(at(2026, 6, 7)));
    expect(journalEngine.validate(e)).toEqual([]);
    expect(journalEngine.validate({ ...e, title: "", content: "" })).not.toEqual([]);
  });

  it("assembles a summary", () => {
    const s = journalEngine.summary(input());
    expect(s.todaysEntries).toBe(1);
    expect(s.mood.average).toBe(4);
    expect(s.streak.current).toBe(1);
    expect(s.latestReflection?.date).toBe("2026-07-07");
    expect(s.outstandingLesson).toBe("Start earlier");
  });

  it("counts entries/reflections/gratitude/reviews", () => {
    const c = journalEngine.counts(input());
    expect(c.entries).toBe(1);
    expect(c.reflections).toBe(1);
    expect(c.gratitude).toBe(1);
    expect(c.reviews).toBe(1);
    expect(c.wordsWritten).toBeGreaterThan(0);
  });

  it("excludes archived entries from counts + summary", () => {
    const s = journalEngine.summary(
      input({ entries: [makeEntry({ archived: true, createdAt: at(2026, 6, 7) })] }),
    );
    expect(s.todaysEntries).toBe(0);
    expect(s.counts.entries).toBe(0);
  });

  it("derives cross-module signals", () => {
    const sig = journalEngine.signals(input());
    expect(sig.loggedToday).toBe(true);
    expect(sig.writingStreak).toBe(1);
    expect(sig.moodAverage).toBe(4);
    expect(sig.outstandingLesson).toBe("Start earlier");
  });

  it("reports not-logged-today when there are no entries for the date", () => {
    const sig = journalEngine.signals(input({ entries: [] }));
    expect(sig.loggedToday).toBe(false);
    expect(sig.writingStreak).toBe(0);
  });
});
