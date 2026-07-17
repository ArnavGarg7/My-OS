import { describe, expect, it } from "vitest";
import {
  callouts,
  checklist,
  codeBlockCount,
  hasTable,
  headings,
  inferTitle,
  mergeTags,
  normalizeTitle,
  parseTags,
  parseWikiLinks,
  slugify,
  snippet,
  toPlainText,
} from "../index";

describe("markdown structure", () => {
  const md = `# Title\n\nSome text.\n\n## Section\n\n\`\`\`ts\n# not a heading\n\`\`\`\n\n- [ ] todo\n- [x] done\n\n> [!note] hi`;

  it("extracts headings ignoring code fences", () => {
    const hs = headings(md);
    expect(hs).toEqual([
      { level: 1, text: "Title" },
      { level: 2, text: "Section" },
    ]);
  });

  it("infers the title from the first h1", () => {
    expect(inferTitle(md)).toBe("Title");
    expect(inferTitle("no heading here\nsecond")).toBe("no heading here");
    expect(inferTitle("")).toBe("");
  });

  it("counts code blocks", () => {
    expect(codeBlockCount(md)).toBe(1);
    expect(codeBlockCount("no code")).toBe(0);
  });

  it("detects tables", () => {
    expect(hasTable("| a | b |\n| --- | --- |\n| 1 | 2 |")).toBe(true);
    expect(hasTable("no table")).toBe(false);
  });

  it("counts checklist items", () => {
    expect(checklist(md)).toEqual({ total: 2, done: 1 });
  });

  it("extracts callout kinds", () => {
    expect(callouts(md)).toEqual(["note"]);
  });

  it("strips markdown to plain text", () => {
    expect(toPlainText("# Hi `code` [[Link]] **bold**")).toContain("Hi");
    expect(toPlainText("# Hi `code` [[Link]]")).toContain("Link");
  });

  it("builds a snippet around a term", () => {
    const s = snippet("The quick brown fox jumps over the lazy dog", "fox");
    expect(s).toContain("fox");
  });
});

describe("wiki-link + tag parsing", () => {
  it("parses wiki links, deduped + alias-stripped", () => {
    expect(
      parseWikiLinks("See [[Machine Learning]] and [[Machine learning]] and [[Databases|DBs]]"),
    ).toEqual(["Machine Learning", "Databases"]);
  });

  it("parses hashtags excluding headings + code", () => {
    expect(parseTags("# Heading\nText #ai and #Deep-Learning `#nope`")).toEqual([
      "ai",
      "deep-learning",
    ]);
  });

  it("merges explicit tags with parsed hashtags, deduped", () => {
    expect(mergeTags(["Math"], "content #ai #math")).toEqual(["math", "ai"]);
  });
});

describe("title normalization", () => {
  it("normalizes case + whitespace", () => {
    expect(normalizeTitle("  Machine   Learning ")).toBe("machine learning");
  });

  it("slugifies deterministically", () => {
    expect(slugify("Machine Learning!")).toBe("machine-learning");
    expect(slugify("  A/B Testing ")).toBe("a-b-testing");
  });
});
