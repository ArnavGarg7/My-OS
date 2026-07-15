import { describe, expect, it } from "vitest";
import { at, makeEntry } from "./fixtures";
import { entriesForDate, filterEntries, search, sortByRecent } from "./selectors";

describe("selectors", () => {
  it("filters out archived entries by default", () => {
    const entries = [makeEntry({ id: "a" }), makeEntry({ id: "b", archived: true })];
    expect(filterEntries(entries, {}).map((e) => e.id)).toEqual(["a"]);
  });

  it("filters by entry type + mood + tag", () => {
    const entries = [
      makeEntry({ id: "a", entryType: "gratitude", mood: "good", tags: ["work"] }),
      makeEntry({ id: "b", entryType: "daily", mood: "low", tags: ["life"] }),
    ];
    expect(filterEntries(entries, { entryType: "gratitude" }).map((e) => e.id)).toEqual(["a"]);
    expect(filterEntries(entries, { mood: "low" }).map((e) => e.id)).toEqual(["b"]);
    expect(filterEntries(entries, { tag: "work" }).map((e) => e.id)).toEqual(["a"]);
  });

  it("sorts by most recent", () => {
    const entries = [
      makeEntry({ id: "old", createdAt: at(2026, 6, 1) }),
      makeEntry({ id: "new", createdAt: at(2026, 6, 7) }),
    ];
    expect(sortByRecent(entries).map((e) => e.id)).toEqual(["new", "old"]);
  });

  it("filters entries for a date", () => {
    const entries = [
      makeEntry({ id: "a", createdAt: at(2026, 6, 6) }),
      makeEntry({ id: "b", createdAt: at(2026, 6, 7) }),
    ];
    expect(entriesForDate(entries, "2026-07-07").map((e) => e.id)).toEqual(["b"]);
  });
});

describe("search", () => {
  const entries = [
    makeEntry({ id: "exact", title: "gratitude", content: "thankful" }),
    makeEntry({ id: "title", title: "Gratitude practice", content: "morning routine" }),
    makeEntry({ id: "body", title: "Random", content: "a note about gratitude in passing" }),
    makeEntry({ id: "arch", title: "gratitude", content: "x", archived: true }),
  ];

  it("returns [] for an empty query", () => {
    expect(search(entries, "  ")).toEqual([]);
  });

  it("ranks exact title above title-contains above body", () => {
    const results = search(entries, "gratitude");
    expect(results[0]?.entry.id).toBe("exact");
    const ids = results.map((r) => r.entry.id);
    expect(ids.indexOf("title")).toBeLessThan(ids.indexOf("body"));
  });

  it("excludes archived entries", () => {
    expect(search(entries, "gratitude").some((r) => r.entry.id === "arch")).toBe(false);
  });

  it("reports where it matched", () => {
    const result = search(entries, "gratitude").find((r) => r.entry.id === "body");
    expect(result?.matchedIn).toContain("body");
  });

  it("matches tags", () => {
    const tagged = [makeEntry({ id: "t", title: "x", content: "y", tags: ["running"] })];
    expect(search(tagged, "running")[0]?.entry.id).toBe("t");
  });
});
