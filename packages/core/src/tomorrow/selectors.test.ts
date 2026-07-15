import { describe, expect, it } from "vitest";
import {
  carryForwardHeadline,
  isEditable,
  priorityTitles,
  statusLabel,
  stepList,
} from "./selectors";
import { collectCarryForward } from "./carryforward";
import { rankPriorities } from "./priorities";
import { makeCarryForward, makePriorities } from "./fixtures";

describe("stepList", () => {
  it("returns all eight ordered steps", () => {
    const list = stepList();
    expect(list).toHaveLength(8);
    expect(list[0]!.step).toBe("review");
    expect(list[7]!.step).toBe("finalize");
    expect(list[0]!.label).toBe("Today's Review");
  });
});

describe("statusLabel + isEditable", () => {
  it("labels each status", () => {
    expect(statusLabel("draft")).toBe("Draft");
    expect(statusLabel("locked")).toBe("Locked");
  });
  it("only draft/planned are editable", () => {
    expect(isEditable("draft")).toBe(true);
    expect(isEditable("planned")).toBe(true);
    expect(isEditable("locked")).toBe(false);
    expect(isEditable("completed")).toBe(false);
  });
});

describe("carryForwardHeadline", () => {
  it("summarises the mix", () => {
    const headline = carryForwardHeadline(collectCarryForward(makeCarryForward()));
    expect(headline).toMatch(/2 tasks/);
  });
  it("celebrates a clean close", () => {
    expect(carryForwardHeadline(collectCarryForward([]))).toMatch(/clean close/i);
  });
});

describe("priorityTitles", () => {
  it("lists the top priority titles", () => {
    const titles = priorityTitles(rankPriorities(makePriorities()));
    expect(titles).toHaveLength(3);
  });
  it("is empty for no candidates", () => {
    expect(priorityTitles(rankPriorities([]))).toHaveLength(0);
  });
});

describe("statusLabel coverage", () => {
  it("labels planned + completed", () => {
    expect(statusLabel("planned")).toBe("Planned");
    expect(statusLabel("completed")).toBe("Completed");
  });
  it("carry-forward headline counts decisions + inbox", () => {
    const headline = carryForwardHeadline(collectCarryForward(makeCarryForward()));
    expect(headline).toMatch(/decision/);
  });
});
