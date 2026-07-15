import { describe, expect, it } from "vitest";
import { makeEntry } from "./fixtures";
import { charCount, readingMinutes, totalWords, wordCount, writingStats } from "./writing";

describe("writing", () => {
  it("counts words", () => {
    expect(wordCount("hello brave new world")).toBe(4);
    expect(wordCount("   ")).toBe(0);
  });

  it("counts characters", () => {
    expect(charCount("abc")).toBe(3);
  });

  it("estimates reading minutes (≥1 for any text)", () => {
    expect(readingMinutes("short")).toBe(1);
    expect(readingMinutes("")).toBe(0);
    expect(readingMinutes(Array(401).fill("word").join(" "))).toBe(3);
  });

  it("assembles writing stats", () => {
    const s = writingStats("one two three");
    expect(s.words).toBe(3);
    expect(s.readingMinutes).toBe(1);
  });

  it("totals words across entries (title + content)", () => {
    const entries = [
      makeEntry({ id: "a", title: "two words", content: "three more words" }),
      makeEntry({ id: "b", title: "x", content: "y" }),
    ];
    expect(totalWords(entries)).toBe(2 + 3 + 1 + 1);
  });
});
