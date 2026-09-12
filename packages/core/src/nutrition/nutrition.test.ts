import { describe, expect, it } from "vitest";
import {
  gramsForPortion,
  goalProgress,
  parseMealText,
  scalePer100g,
  totalMacros,
  type DayLog,
} from "./index";

describe("parseMealText", () => {
  it("splits and reads quantities + units", () => {
    expect(parseMealText("2 eggs and a bowl of rice")).toEqual([
      { food: "eggs", quantity: 2 },
      { food: "rice", quantity: 1, unit: "bowl" },
    ]);
  });
  it("handles grams and 'of', commas, plus", () => {
    expect(parseMealText("100 g chicken breast, 1 cup of milk + 2 slices bread")).toEqual([
      { food: "chicken breast", quantity: 100, unit: "g" },
      { food: "milk", quantity: 1, unit: "cup" },
      { food: "bread", quantity: 2, unit: "slice" },
    ]);
  });
  it("keeps a bare food with no quantity", () => {
    expect(parseMealText("banana")).toEqual([{ food: "banana" }]);
  });
});

describe("gramsForPortion", () => {
  it("converts weight units", () => {
    expect(gramsForPortion(100, "g")).toBe(100);
    expect(gramsForPortion(1, "kg")).toBe(1000);
    expect(gramsForPortion(1, "oz")).toBeCloseTo(28.35, 1);
  });
  it("uses serving grams for serving-based units", () => {
    expect(gramsForPortion(2, "slice", 30)).toBe(60);
  });
  it("returns null when grams can't be derived", () => {
    expect(gramsForPortion(2, "bowl")).toBeNull();
    expect(gramsForPortion(1, undefined)).toBeNull();
  });
});

describe("macro math", () => {
  it("scales per-100g macros", () => {
    expect(scalePer100g({ calories: 150, protein: 10, carbs: 5, fat: 8 }, 200)).toEqual({
      calories: 300,
      protein: 20,
      carbs: 10,
      fat: 16,
    });
  });
  it("totals only actual (or only planned) logs", () => {
    const logs: DayLog[] = [
      { calories: 300, protein: 20, carbs: 10, fat: 16, planned: false },
      { calories: 200, protein: 5, carbs: 30, fat: 2, planned: false },
      { calories: 500, protein: 40, carbs: 40, fat: 10, planned: true },
    ];
    expect(totalMacros(logs)).toEqual({ calories: 500, protein: 25, carbs: 40, fat: 18 });
    expect(totalMacros(logs, true)).toEqual({ calories: 500, protein: 40, carbs: 40, fat: 10 });
  });
  it("computes uncapped goal progress", () => {
    const p = goalProgress(
      { calories: 1000, protein: 60, carbs: 110, fat: 35 },
      { calorieTarget: 2000, proteinTarget: 120, carbsTarget: 220, fatTarget: 70 },
    );
    expect(p).toEqual({ calories: 50, protein: 50, carbs: 50, fat: 50 });
  });
});
