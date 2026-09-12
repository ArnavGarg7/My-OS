import "server-only";
import { validateStructured } from "@myos/ai/structured";
import { parsedTimetableSchema, type ParsedTimetable } from "@myos/core/education";
import { getEnv } from "../env";

/**
 * Timetable vision extraction (Education, Part D). A FEATURE-LOCAL multimodal call — it does NOT go
 * through the (text-only) AI gateway, which stays untouched. It sends an uploaded timetable image to
 * Gemini `generateContent` with an inline-image part, asks for JSON, and validates the result with the
 * pure `validateStructured` helper before anything reaches the DB. Nothing is persisted here — the
 * router returns the parsed timetable for the user to review, then `importTimetable` commits it.
 *
 * Model is overridable via MYOS_VISION_MODEL (default a Gemini flash model). Requires GEMINI_API_KEY.
 */
const VISION_MODEL = process.env.MYOS_VISION_MODEL?.trim() || "gemini-2.5-flash";

const PROMPT = `You are reading a student's weekly class timetable from an image.
Extract it as STRICT JSON with exactly this shape — no commentary, no markdown:
{
  "courses": [{ "title": string, "code"?: string }],
  "sessions": [{
    "courseTitle": string,
    "weekday": number,   // 0=Sunday, 1=Monday, ... 6=Saturday
    "start": "HH:MM",     // 24-hour
    "end": "HH:MM",       // 24-hour
    "kind"?: "lecture" | "lab" | "tutorial" | "seminar" | "other",
    "location"?: string
  }]
}
Rules:
- weekday MUST be 0-6 with 0=Sunday.
- Times are 24-hour "HH:MM". If a class spans several periods, use the full start→end.
- Merge repeated course names into ONE course entry; reference it from sessions via "courseTitle".
- Omit any cell you cannot read confidently rather than guessing.`;

export interface TimetableExtractResult {
  ok: boolean;
  timetable: ParsedTimetable | null;
  error?: string;
}

export async function extractTimetableFromImage(
  imageBase64: string,
  mimeType: string,
): Promise<TimetableExtractResult> {
  const apiKey = getEnv().GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, timetable: null, error: "Image reading needs GEMINI_API_KEY to be set." };
  }

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${VISION_MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: PROMPT },
                { inline_data: { mime_type: mimeType, data: imageBase64 } },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json", temperature: 0 },
        }),
      },
    );
  } catch {
    return { ok: false, timetable: null, error: "Could not reach the vision model." };
  }

  if (!res.ok) {
    return { ok: false, timetable: null, error: `Vision model error (${res.status}).` };
  }

  const json = (await res.json().catch(() => null)) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  } | null;
  const text =
    json?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? "";
  if (!text) {
    return { ok: false, timetable: null, error: "The model returned nothing readable." };
  }

  const parsed = validateStructured(text, parsedTimetableSchema);
  if (!parsed.ok || !parsed.parsed) {
    return {
      ok: false,
      timetable: null,
      error: "Couldn't read a timetable from that image — try a clearer, straight-on photo.",
    };
  }
  return { ok: true, timetable: parsed.parsed };
}
