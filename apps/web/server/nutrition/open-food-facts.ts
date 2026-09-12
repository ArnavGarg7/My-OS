import "server-only";
import type { FoodCandidate } from "./food-db";

/**
 * Open Food Facts resolver — a free, keyless, open database strong on BRANDED/packaged products,
 * including Indian brands (Maggi, etc.) that USDA doesn't carry. Used as the second tier of the food
 * cascade (after USDA). Still a database, not a guess. Per-100g nutriments.
 */
interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | undefined>;
}

function num(v: number | string | undefined): number {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? (n as number) : 0;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function mapProduct(p: OffProduct): FoodCandidate | null {
  const name = (p.product_name ?? "").trim();
  if (!name || !p.code) return null;
  const n = p.nutriments ?? {};
  let calories = num(n["energy-kcal_100g"]);
  if (!calories) {
    const kj = num(n["energy_100g"]);
    if (kj) calories = Math.round(kj / 4.184);
  }
  if (!calories) return null;
  const servingGrams = num(p.serving_quantity);
  return {
    name,
    brand: (p.brands ?? "").split(",")[0]?.trim() ?? "",
    source: "off",
    sourceRef: p.code,
    per100g: {
      calories: Math.round(calories),
      protein: round1(num(n.proteins_100g)),
      carbs: round1(num(n.carbohydrates_100g)),
      fat: round1(num(n.fat_100g)),
    },
    ...(num(n.fiber_100g) ? { fiber100g: round1(num(n.fiber_100g)) } : {}),
    ...(num(n.sugars_100g) ? { sugar100g: round1(num(n.sugars_100g)) } : {}),
    ...(num(n.sodium_100g) ? { sodium100g: round1(num(n.sodium_100g) * 1000) } : {}), // g → mg
    ...(servingGrams > 0 ? { servingGrams } : {}),
  };
}

export async function searchOpenFoodFacts(query: string): Promise<FoodCandidate[]> {
  const url =
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=6` +
    `&fields=code,product_name,brands,nutriments,serving_quantity`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "user-agent": "MyOS-Nutrition/1.0 (self-hosted personal app)" },
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const data = (await res.json().catch(() => null)) as { products?: OffProduct[] } | null;
  return (data?.products ?? [])
    .map(mapProduct)
    .filter((c): c is FoodCandidate => c !== null)
    .slice(0, 5);
}
