import { describe, expect, it } from "vitest";
import { makeNutrition } from "./fixtures";
import { macroSplit, summarizeNutrition } from "./nutrition";

describe("nutrition", () => {
  it("totals macros across logs", () => {
    const s = summarizeNutrition(
      [
        makeNutrition({ id: "a", calories: 600, protein: 40, carbs: 60, fat: 20 }),
        makeNutrition({ id: "b", calories: 400, protein: 30, carbs: 40, fat: 10 }),
      ],
      { calories: 2200, proteinG: 140 },
    );
    expect(s.calories).toBe(1000);
    expect(s.protein).toBe(70);
  });

  it("computes calories + protein remaining", () => {
    const s = summarizeNutrition([makeNutrition({ calories: 500, protein: 40 })], {
      calories: 2200,
      proteinG: 140,
    });
    expect(s.caloriesRemaining).toBe(1700);
    expect(s.proteinRemaining).toBe(100);
  });

  it("clamps remaining at zero when over goal", () => {
    const s = summarizeNutrition([makeNutrition({ calories: 2500, protein: 200 })], {
      calories: 2200,
      proteinG: 140,
    });
    expect(s.caloriesRemaining).toBe(0);
    expect(s.proteinRemaining).toBe(0);
  });

  it("computes a macro split that sums to ~100", () => {
    const split = macroSplit(100, 100, 40);
    expect(split.protein + split.carbs + split.fat).toBeGreaterThanOrEqual(99);
    expect(split.protein + split.carbs + split.fat).toBeLessThanOrEqual(101);
  });

  it("returns zero split with no intake", () => {
    expect(macroSplit(0, 0, 0)).toEqual({ protein: 0, carbs: 0, fat: 0 });
  });

  it("weights fat by 9 kcal/g in the split", () => {
    // 10g protein (40kcal) vs 10g fat (90kcal) → fat share larger.
    const split = macroSplit(10, 0, 10);
    expect(split.fat).toBeGreaterThan(split.protein);
  });
});
