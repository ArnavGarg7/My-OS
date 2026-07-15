import { describe, expect, it } from "vitest";
import { InboxEngine, inboxEngine, sortItems } from "./engine";
import { makeCaptureInput, makeItem, at } from "./fixtures";
import type { InboxItem } from "./types";

const engine = new InboxEngine();

describe("capture", () => {
  it("returns a new item and no duplicates against an empty inbox", () => {
    const { item, duplicates } = engine.capture(makeCaptureInput({ content: "fresh" }), at(10));
    expect(item.status).toBe("new");
    expect(duplicates).toEqual([]);
  });
});

describe("lifecycle transitions", () => {
  it("archive sets status + archivedAt + updatedAt", () => {
    const archived = engine.archive(makeItem(), at(11));
    expect(archived.status).toBe("archived");
    expect(archived.archivedAt).toBe(at(11).toISOString());
    expect(archived.updatedAt).toBe(at(11).toISOString());
  });

  it("delete sets status + deletedAt", () => {
    const deleted = engine.delete(makeItem(), at(11));
    expect(deleted.status).toBe("deleted");
    expect(deleted.deletedAt).toBe(at(11).toISOString());
  });

  it("restore clears archived/deleted/organized and returns to new", () => {
    const archived = engine.archive(makeItem(), at(11));
    const restored = engine.restore(archived, at(12));
    expect(restored.status).toBe("new");
    expect(restored.archivedAt).toBeNull();
    expect(restored.deletedAt).toBeNull();
  });

  it("organize records the destination without changing anything else structurally", () => {
    const organized = engine.organize(makeItem(), "Projects", at(11));
    expect(organized.status).toBe("organized");
    expect(organized.organizedAt).toBe(at(11).toISOString());
    expect(organized.metadata["destination"]).toBe("Projects");
  });

  it("duplicate clones content as a fresh unpersisted capture", () => {
    const clone = engine.duplicate(makeItem({ content: "clone me", title: "Orig" }), at(11));
    expect(clone.id).toBe("");
    expect(clone.content).toBe("clone me");
    expect(clone.source).toBe("manual");
  });

  it("merge combines content and records the merged ids", () => {
    const primary = makeItem({ id: "p", content: "one" });
    const other = makeItem({ id: "o", content: "two" });
    const merged = engine.merge(primary, [other], at(11));
    expect(merged.content).toContain("one");
    expect(merged.content).toContain("two");
    expect(merged.metadata["mergedFrom"]).toEqual(["o"]);
  });
});

describe("findDuplicates", () => {
  const existing: InboxItem[] = [
    makeItem({ id: "a", content: "same body here" }, at(9)),
    makeItem({ id: "b", type: "url", content: "https://dup.com/x" }, at(9)),
  ];

  it("flags same content within the window", () => {
    const candidate = makeItem({ id: "", content: "same body here" }, at(10));
    const dupes = engine.findDuplicates(candidate, existing);
    expect(dupes).toContainEqual({ itemId: "a", reason: "same content" });
  });

  it("flags same url within the window", () => {
    const candidate = makeItem({ id: "", type: "url", content: "https://dup.com/x/" }, at(10));
    const dupes = engine.findDuplicates(candidate, existing);
    expect(dupes.some((d) => d.itemId === "b" && d.reason === "same url")).toBe(true);
  });

  it("flags same title within the window", () => {
    const candidate = makeItem({ id: "", title: "Same body here", content: "different" }, at(10));
    const dupes = engine.findDuplicates(candidate, existing);
    expect(dupes.some((d) => d.itemId === "a" && d.reason === "same title")).toBe(true);
  });

  it("ignores matches outside the capture window", () => {
    const candidate = makeItem({ id: "", content: "same body here" }, at(9));
    const old = makeItem({ id: "old", content: "same body here" }, new Date(2026, 6, 1, 9));
    expect(engine.findDuplicates(candidate, [old])).toEqual([]);
  });

  it("never matches deleted items", () => {
    const deleted = engine.delete(makeItem({ id: "d", content: "same body here" }, at(9)), at(9));
    const candidate = makeItem({ id: "", content: "same body here" }, at(10));
    expect(engine.findDuplicates(candidate, [deleted])).toEqual([]);
  });

  it("never auto-deletes — only reports", () => {
    const candidate = makeItem({ id: "", content: "same body here" }, at(10));
    engine.findDuplicates(candidate, existing);
    expect(existing[0]!.status).toBe("new");
  });
});

describe("search", () => {
  const items: InboxItem[] = [
    makeItem({ id: "1", title: "Buy milk", content: "grocery run" }, at(9)),
    makeItem({ id: "2", title: "Read book", content: "the pragmatic programmer" }, at(10)),
    makeItem(
      { id: "3", type: "task", title: "Errands", content: "milk the cow at the farm" },
      at(11),
    ),
  ];

  it("matches text across title and content", () => {
    const results = engine.search(items, { text: "milk" });
    expect(results.map((r) => r.id).sort()).toEqual(["1", "3"]);
  });

  it("ranks title matches above content matches", () => {
    // item 1 matches in the title (+10), item 3 only in content (+4)
    const results = engine.search(items, { text: "milk" });
    expect(results[0]!.id).toBe("1");
  });

  it("filters by type", () => {
    const results = engine.search(items, { type: "task" });
    expect(results.map((r) => r.id)).toEqual(["3"]);
  });

  it("requires all keywords to be present", () => {
    expect(
      engine.search(items, { keywords: ["pragmatic", "programmer"] }).map((r) => r.id),
    ).toEqual(["2"]);
    expect(engine.search(items, { keywords: ["pragmatic", "milk"] })).toEqual([]);
  });

  it("filters by capturedAt date bounds", () => {
    const results = engine.search(items, { from: at(10).toISOString() });
    expect(results.map((r) => r.id).sort()).toEqual(["2", "3"]);
  });
});

describe("filter + sort", () => {
  const items: InboxItem[] = [
    makeItem({ id: "1", title: "b" }, at(9)),
    makeItem({ id: "2", title: "a", status: "archived" }, at(11)),
    makeItem({ id: "3", title: "c" }, at(10)),
  ];

  it("filters by status", () => {
    expect(
      engine
        .filter(items, { status: "new" })
        .map((i) => i.id)
        .sort(),
    ).toEqual(["1", "3"]);
  });

  it("sorts newest first by default", () => {
    expect(engine.filter(items, {}).map((i) => i.id)).toEqual(["2", "3", "1"]);
  });

  it("sortItems supports oldest and title", () => {
    expect(sortItems(items, "oldest").map((i) => i.id)).toEqual(["1", "3", "2"]);
    expect(sortItems(items, "title").map((i) => i.id)).toEqual(["2", "1", "3"]);
  });
});

describe("singleton", () => {
  it("exposes a shared stateless engine", () => {
    expect(inboxEngine).toBeInstanceOf(InboxEngine);
  });
});
