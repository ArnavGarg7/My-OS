import { describe, expect, it } from "vitest";
import { parseDuration, parseLog, parseVolume } from "./parser";

describe("parser", () => {
  it("parses durations in h/m forms", () => {
    expect(parseDuration("30 min")).toBe(30);
    expect(parseDuration("1h")).toBe(60);
    expect(parseDuration("7h30")).toBe(450);
    expect(parseDuration("90m")).toBe(90);
  });

  it("parses volumes in ml/l", () => {
    expect(parseVolume("500ml")).toBe(500);
    expect(parseVolume("1.5l")).toBe(1500);
    expect(parseVolume("2 l")).toBe(2000);
  });

  it("parses a water log", () => {
    expect(parseLog("drank 500ml")).toEqual({ kind: "water", amountMl: 500, source: "water" });
  });

  it("detects coffee as a hydration source", () => {
    const r = parseLog("coffee 250ml");
    expect(r).toMatchObject({ kind: "water", source: "coffee" });
  });

  it("parses a workout with duration + type", () => {
    expect(parseLog("ran 30 min")).toEqual({
      kind: "workout",
      type: "cardio",
      durationMinutes: 30,
    });
  });

  it("defaults workout duration to 30", () => {
    expect(parseLog("gym")).toEqual({ kind: "workout", type: "strength", durationMinutes: 30 });
  });

  it("parses a sleep log", () => {
    expect(parseLog("slept 7h30")).toEqual({ kind: "sleep", durationMinutes: 450 });
  });

  it("parses a meal with calories", () => {
    expect(parseLog("lunch 600 cal")).toEqual({ kind: "meal", meal: "lunch", calories: 600 });
  });

  it("parses a weight log", () => {
    expect(parseLog("weight 75.5kg")).toEqual({ kind: "weight", weight: 75.5 });
  });

  it("returns unknown for unrecognised text", () => {
    expect(parseLog("hello world")).toEqual({ kind: "unknown", text: "hello world" });
  });
});
