import { parseTask } from "../task/parser";
import type { Intent } from "./types";

/**
 * Deterministic intent parser (Stage 9). Recognises the common commands WITHOUT calling
 * AI — cost discipline: everything computable stays deterministic; AI is only a fallback
 * for phrasings this misses. Reuses the existing `parseTask` for task creation (no second
 * parser). Returns null when it doesn't confidently match, so the server can try AI.
 */

const MIN_RE = /(\d{1,3})\s*(?:min|mins|minute|minutes|m)\b/;

function extractTaskQuery(text: string): string | null {
  const m = text.match(/\b(?:on|for)\s+(.+?)(?:\s+for\s+\d|\s*$)/i);
  const q = m?.[1]?.trim();
  return q && q.length > 0 ? q.replace(/[.?!]+$/, "").trim() : null;
}

export function parseIntent(raw: string, now: Date): Intent | null {
  const text = raw.trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  // Weather
  if (/\bweather\b/.test(lower)) {
    return { kind: "weather", when: /\btomorrow\b/.test(lower) ? "tomorrow" : "today" };
  }

  // Recommendation ("what should I work on / do next")
  if (/\b(what should i (work on|do)|what.?s next|next action|what to work on)\b/.test(lower)) {
    return { kind: "recommend" };
  }

  // Workload ("is my day overloaded")
  if (
    /\b(overloaded|over-?loaded|workload|too much (today|on)|is my day (full|packed))\b/.test(lower)
  ) {
    return { kind: "workload" };
  }

  // Calendar / meetings / schedule
  if (/\b(meeting|meetings|schedule|agenda|calendar)\b/.test(lower)) {
    return { kind: "query_calendar", range: /\btomorrow\b/.test(lower) ? "tomorrow" : "today" };
  }

  // Start focus / deep work / pomodoro (optionally with duration + task)
  if (/\b(focus|deep work|pomodoro)\b/.test(lower) && /\b(start|begin|do|run)\b/.test(lower)) {
    const mins = lower.match(MIN_RE);
    return {
      kind: "start_focus",
      taskQuery: extractTaskQuery(text),
      durationMinutes: mins?.[1] ? Number(mins[1]) : null,
    };
  }

  // Capture to inbox
  const capture = text.match(/^(?:capture|note|remember|jot)\s+(?:this\s+)?(?:as\s+)?(.+)$/i);
  if (capture?.[1]) return { kind: "capture_inbox", content: capture[1].trim() };

  // Create task (explicit verb prefix — a bare phrase is too ambiguous to auto-create)
  const create = text.match(/^(?:add|create|new task|task|todo)\s*:?\s+(.+)$/i);
  if (create?.[1]) {
    const draft = parseTask(create[1].trim(), now);
    return {
      kind: "create_task",
      title: draft.title,
      dueAt: draft.dueAt ?? null,
      priority: draft.priority,
      estimatedMinutes: draft.estimatedMinutes ?? null,
    };
  }

  return null;
}
