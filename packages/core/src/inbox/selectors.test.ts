import { describe, expect, it } from "vitest";
import { countNew, selectArchived, selectItem, selectNew, statusCounts } from "./selectors";
import { makeItem, at } from "./fixtures";
import type { InboxItem } from "./types";

const items: InboxItem[] = [
  makeItem({ id: "1" }, at(9)),
  makeItem({ id: "2", status: "archived" }, at(10)),
  makeItem({ id: "3" }, at(11)),
  makeItem({ id: "4", status: "organized" }, at(12)),
];

describe("selectNew", () => {
  it("returns only new items, newest first", () => {
    expect(selectNew(items).map((i) => i.id)).toEqual(["3", "1"]);
  });
});

describe("countNew", () => {
  it("counts unprocessed items", () => {
    expect(countNew(items)).toBe(2);
  });
});

describe("selectArchived", () => {
  it("returns archived items", () => {
    expect(selectArchived(items).map((i) => i.id)).toEqual(["2"]);
  });
});

describe("selectItem", () => {
  it("finds by id or returns null", () => {
    expect(selectItem(items, "3")?.id).toBe("3");
    expect(selectItem(items, "nope")).toBeNull();
  });
});

describe("statusCounts", () => {
  it("groups counts by status", () => {
    expect(statusCounts(items)).toEqual({ new: 2, organized: 1, archived: 1, deleted: 0 });
  });
});
