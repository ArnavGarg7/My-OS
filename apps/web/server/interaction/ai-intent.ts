import "server-only";
import type { Intent } from "@myos/core/interaction";
import { createEnvProviders } from "../assistant/providers";

/**
 * AI intent fallback (Stage 9). Used ONLY when the deterministic parser misses — cost
 * discipline. Reuses the existing env-wired provider clients (Groq preferred for latency,
 * Gemini as fallback); keys stay server-side. Asks for a strict JSON intent, validates the
 * shape ourselves (AI is never trusted as the source of truth — the server resolves targets
 * against real data afterwards). Any failure/timeout → null, and the OS keeps working.
 */

const SYSTEM = `You translate a user's short command for a personal productivity OS into ONE JSON intent.
Return ONLY compact JSON, no prose. Allowed shapes:
{"kind":"create_task","title":string,"dueAt":null,"priority":"medium","estimatedMinutes":null}
{"kind":"capture_inbox","content":string}
{"kind":"start_focus","taskQuery":string|null,"durationMinutes":number|null}
{"kind":"query_calendar","range":"today"|"tomorrow"}
{"kind":"recommend"}
{"kind":"workload"}
{"kind":"weather","when":"today"|"tomorrow"}
{"kind":"unknown","text":string}
If unsure, use {"kind":"unknown","text":<original>}.`;

function coerce(obj: unknown, original: string): Intent | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  switch (o.kind) {
    case "create_task":
      return typeof o.title === "string" && o.title.trim()
        ? {
            kind: "create_task",
            title: o.title.trim(),
            dueAt: null,
            priority: "medium",
            estimatedMinutes: null,
          }
        : null;
    case "capture_inbox":
      return typeof o.content === "string" && o.content.trim()
        ? { kind: "capture_inbox", content: o.content.trim() }
        : null;
    case "start_focus":
      return {
        kind: "start_focus",
        taskQuery: typeof o.taskQuery === "string" ? o.taskQuery : null,
        durationMinutes: typeof o.durationMinutes === "number" ? o.durationMinutes : null,
      };
    case "query_calendar":
      return { kind: "query_calendar", range: o.range === "tomorrow" ? "tomorrow" : "today" };
    case "recommend":
      return { kind: "recommend" };
    case "workload":
      return { kind: "workload" };
    case "weather":
      return { kind: "weather", when: o.when === "tomorrow" ? "tomorrow" : "today" };
    default:
      return { kind: "unknown", text: original };
  }
}

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

/** Classify a command via AI. Groq first (fast), Gemini fallback. Null on any failure. */
export async function classifyIntent(text: string): Promise<Intent | null> {
  const providers = createEnvProviders();
  // Groq first (low latency), Gemini as fallback — both behind the existing provider abstraction.
  // Model ids are resolved per the account's available catalogs (verified live).
  const order = [
    { client: providers.groq, model: "openai/gpt-oss-20b" },
    { client: providers.gemini, model: "gemini-3.6-flash" },
  ];
  for (const { client, model } of order) {
    if (!client) continue;
    try {
      const result = await Promise.race([
        client.generate({
          modelId: model,
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: text },
          ],
          // Generous headroom: gpt-oss is a reasoning model that spends tokens before the JSON.
          maxOutputTokens: 600,
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 12000)),
      ]);
      const intent = coerce(extractJson(result.text), text);
      if (intent) return intent;
    } catch {
      // try the next provider; if all fail the caller treats it as "unknown"
    }
  }
  return null;
}
