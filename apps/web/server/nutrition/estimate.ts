import "server-only";
import { z } from "zod";
import { validateStructured } from "@myos/ai/structured";
import type { FoodCandidate } from "./food-db";
import { getEnv } from "../env";

/**
 * Last-tier food resolver: an AI ESTIMATE for foods in neither USDA nor Open Food Facts (many home-made
 * Indian dishes, regional items). Clearly flagged `estimated: true` and shown as such — the user still
 * confirms before logging, so it's an honest fallback, not the DB masquerading. Feature-local Gemini
 * call (does not touch the AI gateway). Returns null when unavailable.
 */
const MODEL = process.env.MYOS_VISION_MODEL?.trim() || "gemini-2.5-flash";

const schema = z.object({
  name: z.string().min(1).max(200),
  per100g: z.object({
    calories: z.number().min(0).max(1000),
    protein: z.number().min(0).max(100),
    carbs: z.number().min(0).max(100),
    fat: z.number().min(0).max(100),
  }),
  /** Grams in one typical serving/packet/piece of the item. */
  servingGrams: z.number().positive().max(5000).optional(),
});

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export async function estimateFood(query: string): Promise<FoodCandidate | null> {
  const apiKey = getEnv().GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt =
    `Estimate the nutrition of the food: "${query}". Home-made and regional Indian dishes and Indian ` +
    `brands (e.g. "1 packet Maggi") are expected. Return ONLY JSON:\n` +
    `{ "name": string, "per100g": { "calories": number, "protein": number, "carbs": number, "fat": number }, "servingGrams": number }\n` +
    `- per100g values are PER 100 GRAMS.\n` +
    `- servingGrams = grams in ONE typical serving/packet/piece of this item.\n` +
    `Give realistic values; do not return zeros.`;

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        }),
      },
    );
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const json = (await res.json().catch(() => null)) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  } | null;
  const text =
    json?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? "";
  if (!text) return null;

  const parsed = validateStructured(text, schema);
  if (!parsed.ok || !parsed.parsed || parsed.parsed.per100g.calories <= 0) return null;
  const p = parsed.parsed;
  return {
    name: p.name || query,
    brand: "",
    source: "ai",
    estimated: true,
    sourceRef: "",
    per100g: {
      calories: Math.round(p.per100g.calories),
      protein: round1(p.per100g.protein),
      carbs: round1(p.per100g.carbs),
      fat: round1(p.per100g.fat),
    },
    ...(p.servingGrams ? { servingGrams: p.servingGrams } : {}),
  };
}
