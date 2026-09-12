import "server-only";
import { getEnv } from "../env";

/**
 * Food database resolver (Nutrition module). Queries USDA FoodData Central — the SOURCE OF TRUTH for
 * calories/macros. A direct request/response lookup (not a synced connector), the same shape as the
 * timetable vision extractor. Returns per-100g macros for the search candidates; the caller scales by
 * the confirmed portion. Never fabricates numbers — an empty result means "ask the user", not "guess".
 *
 * Free key: https://fdc.nal.usda.gov/api-key-signup.html → FDC_API_KEY. Falls back to the public
 * low-volume DEMO_KEY so it works out of the box.
 */
export interface FoodCandidate {
  name: string;
  brand: string;
  source: "usda";
  sourceRef: string;
  per100g: { calories: number; protein: number; carbs: number; fat: number };
  fiber100g?: number;
  sugar100g?: number;
  sodium100g?: number;
  /** Grams in one label serving, when USDA gives it in grams (lets serving-based portions resolve). */
  servingGrams?: number;
}

interface UsdaNutrient {
  nutrientNumber?: string;
  unitName?: string;
  value?: number;
}
interface UsdaFood {
  fdcId?: number;
  description?: string;
  brandName?: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients?: UsdaNutrient[];
}

/** First non-null value for any of `numbers`, preferring an entry in `preferUnit`. */
function nutrient(nutrients: UsdaNutrient[], numbers: string[], preferUnit?: string): number {
  for (const num of numbers) {
    const matches = nutrients.filter((n) => n.nutrientNumber === num && n.value != null);
    if (matches.length === 0) continue;
    if (preferUnit) {
      const pref = matches.find((n) => (n.unitName ?? "").toUpperCase() === preferUnit);
      if (pref?.value != null) return pref.value;
    }
    return matches[0]!.value as number;
  }
  return 0;
}

function toTitle(s: string): string {
  const lower = s.trim().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function mapFood(f: UsdaFood): FoodCandidate | null {
  if (!f.fdcId || !f.description) return null;
  const n = f.foodNutrients ?? [];
  let calories = nutrient(n, ["208"], "KCAL");
  if (!calories) {
    const kj = nutrient(n, ["268", "958"], "KJ");
    if (kj) calories = Math.round(kj / 4.184);
  }
  const per100g = {
    calories: Math.round(calories),
    protein: round1(nutrient(n, ["203"])),
    carbs: round1(nutrient(n, ["205"])),
    fat: round1(nutrient(n, ["204"])),
  };
  const servingUnit = (f.servingSizeUnit ?? "").toUpperCase();
  const servingGrams =
    f.servingSize && (servingUnit === "G" || servingUnit === "GRM") ? f.servingSize : undefined;
  const fiber = round1(nutrient(n, ["291"]));
  const sugar = round1(nutrient(n, ["269"]));
  const sodium = round1(nutrient(n, ["307"]));
  return {
    name: toTitle(f.description),
    brand: f.brandName ?? f.brandOwner ?? "",
    source: "usda",
    sourceRef: String(f.fdcId),
    per100g,
    ...(fiber ? { fiber100g: fiber } : {}),
    ...(sugar ? { sugar100g: sugar } : {}),
    ...(sodium ? { sodium100g: sodium } : {}),
    ...(servingGrams ? { servingGrams } : {}),
  };
}

export interface FoodSearchResult {
  ok: boolean;
  candidates: FoodCandidate[];
  error?: string;
}

export async function searchFoodDb(query: string): Promise<FoodSearchResult> {
  const apiKey = getEnv().FDC_API_KEY || "DEMO_KEY";
  const url =
    `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}` +
    `&query=${encodeURIComponent(query)}&pageSize=6&dataType=${encodeURIComponent("Foundation,SR Legacy,Branded")}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return { ok: false, candidates: [], error: "Couldn't reach the food database." };
  }
  if (!res.ok) {
    const error =
      res.status === 429
        ? "Food database rate limit reached — set FDC_API_KEY in .env for a higher quota."
        : `Food database error (${res.status}).`;
    return { ok: false, candidates: [], error };
  }
  const data = (await res.json().catch(() => null)) as { foods?: UsdaFood[] } | null;
  const candidates = (data?.foods ?? [])
    .map(mapFood)
    .filter((c): c is FoodCandidate => c !== null && c.per100g.calories > 0);
  return { ok: true, candidates };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
