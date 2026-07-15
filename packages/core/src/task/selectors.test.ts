import { describe, expect, it } from "vitest";
import {
  filterTasks,
  searchTasks,
  selectLabels,
  selectOpen,
  selectOverdue,
  selectScheduled,
  sortTasks,
  taskCounts,
} from "./selectors";
import { makeLabel, makeTask, at } from "./fixtures";
import type { Task } from "./types";

const label = makeLabel({ id: "l1", name: "Work" });

const tasks: Task[] = [
  makeTask({ id: "1", title: "Bravo", priority: "low", status: "not_started" }),
  makeTask({
    id: "2",
    title: "Alpha",
    priority: "urgent",
    status: "in_progress",
    scheduledStart: at(10).toISOString(),
  }),
  makeTask({ id: "3", title: "Charlie", status: "completed" }),
  makeTask({
    id: "4",
    title: "Delta",
    status: "not_started",
    dueAt: at(8).toISOString(),
    labels: [label],
  }),
];

describe("selectors", () => {
  it("selectOpen excludes completed/archived", () => {
    expect(
      selectOpen(tasks)
        .map((t) => t.id)
        .sort(),
    ).toEqual(["1", "2", "4"]);
  });

  it("selectScheduled returns scheduled, non-completed tasks", () => {
    expect(selectScheduled(tasks).map((t) => t.id)).toEqual(["2"]);
  });

  it("selectOverdue returns open tasks past due", () => {
    expect(selectOverdue(tasks, at(10)).map((t) => t.id)).toEqual(["4"]);
  });

  it("taskCounts summarizes the set", () => {
    expect(taskCounts(tasks, at(10))).toEqual({ open: 3, scheduled: 1, overdue: 1, completed: 1 });
  });

  it("filterTasks narrows by status / priority / label", () => {
    expect(filterTasks(tasks, { priority: "urgent" }).map((t) => t.id)).toEqual(["2"]);
    expect(filterTasks(tasks, { labelId: "l1" }).map((t) => t.id)).toEqual(["4"]);
  });

  it("sortTasks by priority puts urgent first", () => {
    expect(sortTasks(tasks, "priority")[0]!.id).toBe("2");
  });

  it("sortTasks by title is alphabetical", () => {
    expect(sortTasks(tasks, "title").map((t) => t.title)).toEqual([
      "Alpha",
      "Bravo",
      "Charlie",
      "Delta",
    ]);
  });

  it("sortTasks by due orders soonest first, nulls last", () => {
    const ids = sortTasks(tasks, "due").map((t) => t.id);
    expect(ids[0]).toBe("4"); // only task with a due date
    expect(ids[ids.length - 1]).not.toBe("4");
  });

  it("searchTasks with empty text returns everything", () => {
    expect(searchTasks(tasks, "  ").length).toBe(tasks.length);
  });

  it("searchTasks matches title + description", () => {
    expect(searchTasks(tasks, "alpha").map((t) => t.id)).toEqual(["2"]);
    expect(searchTasks(tasks, "zzz")).toEqual([]);
  });

  it("selectLabels returns distinct labels", () => {
    expect(selectLabels(tasks)).toEqual([label]);
  });
});
