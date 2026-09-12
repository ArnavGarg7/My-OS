/**
 * Nutrition — pure core (no IO, no AI, deterministic). Parses a typed/spoken meal into food items +
 * portions, scales per-100g macros to a portion, and totals a day against goals. The nutrition DATABASE
 * (USDA, resolved server-side) is the source of truth for the numbers — this module never invents them.
 */

export * from "./schemas";

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ParsedFoodItem {
  food: string;
  quantity?: number;
  unit?: string;
}

const SPLIT = /\s*(?:,|\band\b|\bplus\b|\+|&|\bwith\b)\s*/i;

const WEIGHT_UNITS: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};
const UNIT_ALIASES: Record<string, string> = {
  gram: "g",
  grams: "g",
  kilogram: "kg",
  cups: "cup",
  bowls: "bowl",
  glasses: "glass",
  slices: "slice",
  pieces: "piece",
  servings: "serving",
  scoops: "scoop",
};
const KNOWN_UNITS = new Set([
  "g",
  "kg",
  "mg",
  "ml",
  "l",
  "oz",
  "lb",
  "cup",
  "bowl",
  "glass",
  "slice",
  "piece",
  "serving",
  "tbsp",
  "tsp",
  "scoop",
  "handful",
  "can",
  "bottle",
]);

function parseNumber(token: string): number | undefined {
  if (token.includes("/")) {
    const [a, b] = token.split("/").map(Number);
    return a && b ? a / b : undefined;
  }
  const n = Number(token);
  return Number.isFinite(n) ? n : undefined;
}

/** Parse one "2 eggs" / "a bowl of rice" chunk into { food, quantity?, unit? }. */
function parseChunk(raw: string): ParsedFoodItem | null {
  let t = raw.trim().toLowerCase();
  if (!t) return null;

  let quantity: number | undefined;
  // Leading article → an implied single unit ("a bowl" = 1 bowl; "some rice" = unquantified).
  const article = t.match(/^(a|an|one)\s+/);
  if (article) {
    quantity = 1;
    t = t.slice(article[0].length);
  } else {
    t = t.replace(/^(some|the)\s+/, "");
  }

  const num = t.match(/^(\d+(?:\.\d+)?|\d+\/\d+)\s*/);
  if (num?.[1]) {
    quantity = parseNumber(num[1]);
    t = t.slice(num[0].length).trim();
  }

  let unit: string | undefined;
  const unitMatch = t.match(/^([a-z]+)\.?\s+(?:of\s+)?/);
  if (unitMatch?.[1]) {
    const candidate = UNIT_ALIASES[unitMatch[1]] ?? unitMatch[1];
    if (KNOWN_UNITS.has(candidate)) {
      unit = candidate;
      t = t.slice(unitMatch[0].length).trim();
    }
  }

  const food = t.replace(/\s+/g, " ").trim();
  if (!food) return null;
  return { food, ...(quantity !== undefined ? { quantity } : {}), ...(unit ? { unit } : {}) };
}

/** Parse a whole meal utterance ("2 eggs and a bowl of rice") into food items. */
export function parseMealText(text: string): ParsedFoodItem[] {
  return text
    .split(SPLIT)
    .map(parseChunk)
    .filter((x): x is ParsedFoodItem => x !== null);
}

/**
 * Grams for a portion, when derivable: weight units convert directly; a serving-based unit uses the
 * food's known serving grams × quantity. Returns null when it can't be determined (the UI then asks the
 * user for the amount rather than guessing).
 */
export function gramsForPortion(
  quantity: number | undefined,
  unit: string | undefined,
  servingGrams?: number,
): number | null {
  const q = quantity ?? 1;
  if (unit && WEIGHT_UNITS[unit] !== undefined) return q * WEIGHT_UNITS[unit];
  if (unit === "ml" || unit === "l") return q * (unit === "l" ? 1000 : 1); // approx (water-like)
  if (servingGrams && servingGrams > 0) return q * servingGrams;
  return null;
}

/** Scale per-100g macros to a number of grams. */
export function scalePer100g(per100g: Macros, grams: number): Macros {
  const f = grams / 100;
  return {
    calories: Math.round(per100g.calories * f),
    protein: round1(per100g.protein * f),
    carbs: round1(per100g.carbs * f),
    fat: round1(per100g.fat * f),
  };
}

export interface DayLog extends Macros {
  planned: boolean;
}

/** Sum the macros of a day's logs, filtered to actual (default) or planned. */
export function totalMacros(logs: DayLog[], planned = false): Macros {
  return logs
    .filter((l) => l.planned === planned)
    .reduce(
      (acc, l) => ({
        calories: acc.calories + l.calories,
        protein: round1(acc.protein + l.protein),
        carbs: round1(acc.carbs + l.carbs),
        fat: round1(acc.fat + l.fat),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
}

export interface NutritionGoalLike {
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
}

/** Progress toward each goal as a 0..100+ percentage (uncapped so overshoot is visible). */
export function goalProgress(totals: Macros, goal: NutritionGoalLike) {
  const pct = (v: number, t: number) => (t > 0 ? Math.round((v / t) * 100) : 0);
  return {
    calories: pct(totals.calories, goal.calorieTarget),
    protein: pct(totals.protein, goal.proteinTarget),
    carbs: pct(totals.carbs, goal.carbsTarget),
    fat: pct(totals.fat, goal.fatTarget),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
