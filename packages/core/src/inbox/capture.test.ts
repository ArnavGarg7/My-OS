import { describe, expect, it } from "vitest";
import { contentHash, createCaptureItem, deriveTitle, extractUrl, normalizeUrl } from "./capture";
import { makeCaptureInput, at } from "./fixtures";

describe("contentHash", () => {
  it("is deterministic and whitespace/case-insensitive", () => {
    expect(contentHash("Hello World")).toBe(contentHash("hello   world"));
    expect(contentHash("Hello World")).toBe(contentHash("  HELLO WORLD  "));
  });

  it("differs for different content", () => {
    expect(contentHash("apples")).not.toBe(contentHash("oranges"));
  });
});

describe("normalizeUrl", () => {
  it("strips protocol and trailing slash and lowercases", () => {
    expect(normalizeUrl("https://Example.com/path/")).toBe("example.com/path");
    expect(normalizeUrl("http://example.com")).toBe("example.com");
  });
});

describe("extractUrl", () => {
  it("finds the first url in text", () => {
    expect(extractUrl("see https://a.com/x for more")).toBe("https://a.com/x");
  });
  it("returns null when there is none", () => {
    expect(extractUrl("no links here")).toBeNull();
  });
});

describe("deriveTitle", () => {
  it("uses an explicit title when given", () => {
    expect(deriveTitle(makeCaptureInput({ title: "My Title", content: "body" }))).toBe("My Title");
  });

  it("derives from the first line of content", () => {
    expect(deriveTitle(makeCaptureInput({ content: "First line\nSecond line" }))).toBe(
      "First line",
    );
  });

  it("truncates long single-line content with an ellipsis", () => {
    const long = "x".repeat(200);
    const title = deriveTitle(makeCaptureInput({ content: long }));
    expect(title.endsWith("…")).toBe(true);
    expect(title.length).toBeLessThanOrEqual(80);
  });

  it("falls back to Untitled capture when empty", () => {
    expect(deriveTitle(makeCaptureInput({ content: "   " }))).toBe("Untitled capture");
  });
});

describe("createCaptureItem", () => {
  it("builds a new, unpersisted item stamped with the capture time", () => {
    const item = createCaptureItem(makeCaptureInput({ content: "hello" }), at(9));
    expect(item.id).toBe("");
    expect(item.status).toBe("new");
    expect(item.capturedAt).toBe(at(9).toISOString());
    expect(item.metadata["contentHash"]).toBeDefined();
    expect(item.organizedAt).toBeNull();
  });

  it("stores a normalized url for url captures", () => {
    const item = createCaptureItem(
      makeCaptureInput({ type: "url", content: "https://Example.com/a/" }),
      at(9),
    );
    expect(item.metadata["url"]).toBe("example.com/a");
  });

  it("extracts an embedded url from non-url captures", () => {
    const item = createCaptureItem(
      makeCaptureInput({ type: "note", content: "look at https://x.io/y please" }),
      at(9),
    );
    expect(item.metadata["url"]).toBe("x.io/y");
  });
});
