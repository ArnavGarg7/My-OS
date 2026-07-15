import { describe, expect, it } from "vitest";
import { isSessionType, parseFocusCommand, parseInterruption } from "../parser";

describe("focus command parser", () => {
  it("parses a deep work session with minutes", () => {
    const r = parseFocusCommand("deep work 90 minutes on the report");
    expect(r.input.type).toBe("deep_work");
    expect(r.input.plannedMinutes).toBe(90);
    expect(r.matchedType).toBe(true);
    expect(r.matchedMinutes).toBe(true);
  });

  it("defaults to focus when no type given", () => {
    const r = parseFocusCommand("45 minutes");
    expect(r.input.type).toBe("focus");
    expect(r.input.plannedMinutes).toBe(45);
    expect(r.matchedType).toBe(false);
  });

  it("does not let 'preview' trip the review alias", () => {
    const r = parseFocusCommand("preview the deck");
    expect(r.input.type).toBe("focus");
    expect(r.matchedType).toBe(false);
  });

  it("matches review as a whole word", () => {
    const r = parseFocusCommand("review pull requests");
    expect(r.input.type).toBe("review");
  });

  it("maps admin to shallow work", () => {
    expect(parseFocusCommand("admin email").input.type).toBe("shallow_work");
  });

  it("ignores absurd minute values", () => {
    const r = parseFocusCommand("focus 9000");
    expect(r.matchedMinutes).toBe(false);
    expect(r.input.plannedMinutes).toBeUndefined();
  });

  it("recognises multi-word planning", () => {
    expect(parseFocusCommand("planning session").input.type).toBe("planning");
  });

  it("parseInterruption maps common phrases", () => {
    expect(parseInterruption("phone call")).toBe("phone");
    expect(parseInterruption("slack message")).toBe("message");
    expect(parseInterruption("got distracted")).toBe("distraction");
    expect(parseInterruption("something else")).toBe("other");
  });

  it("isSessionType validates the enum", () => {
    expect(isSessionType("deep_work")).toBe(true);
    expect(isSessionType("nonsense")).toBe(false);
  });
});
