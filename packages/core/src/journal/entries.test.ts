import { describe, expect, it } from "vitest";
import { at, makeEntry } from "./fixtures";
import {
  addLink,
  archiveEntry,
  createEntry,
  normalizeTags,
  removeLink,
  updateEntry,
  validateEntry,
} from "./entries";

const now = new Date(at(2026, 6, 8));

describe("entries", () => {
  it("creates an entry with defaults", () => {
    const e = createEntry({ title: "  Hi  ", content: "body" }, now);
    expect(e.title).toBe("Hi");
    expect(e.entryType).toBe("daily");
    expect(e.archived).toBe(false);
    expect(e.mood).toBeNull();
  });

  it("normalizes tags (lowercase, dedupe, strip #)", () => {
    expect(normalizeTags(["#Work", "work", " Focus "])).toEqual(["work", "focus"]);
  });

  it("updates fields and stamps updatedAt", () => {
    const e = makeEntry({ createdAt: at(2026, 6, 7) });
    const next = updateEntry(e, { title: "New", mood: "good" }, now);
    expect(next.title).toBe("New");
    expect(next.mood).toBe("good");
    expect(next.updatedAt).toBe(now.toISOString());
  });

  it("archives an entry", () => {
    expect(archiveEntry(makeEntry(), now).archived).toBe(true);
  });

  it("adds a link idempotently", () => {
    const e = makeEntry();
    const once = addLink(e, "project", "p1");
    const twice = addLink(once, "project", "p1");
    expect(twice.links).toHaveLength(1);
  });

  it("removes a link", () => {
    const e = addLink(makeEntry(), "task", "t1");
    expect(removeLink(e, "task", "t1").links).toHaveLength(0);
  });

  it("validates that an entry needs a title or content", () => {
    expect(validateEntry(makeEntry({ title: "", content: "" }))).toContain(
      "An entry needs a title or content.",
    );
    expect(validateEntry(makeEntry({ title: "ok" }))).toEqual([]);
  });
});
