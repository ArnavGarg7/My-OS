/**
 * Interaction / intent model (Stage 9). The structured intents natural language (text or
 * voice) resolves to. This is the seam between "what the user said" and "what My OS does":
 * a request becomes a validated Intent, and the SERVER invokes the EXISTING capability for
 * it (task.create, focus.start, calendar, chief, weather). AI never becomes the source of
 * truth — it only helps map words to one of these intents; the deterministic OS executes.
 *
 * Pure + dependency-free: the same intents power text, voice and widgets, on web today and
 * a future native/voice client unchanged.
 */

export type IntentKind =
  | "create_task"
  | "capture_inbox"
  | "start_focus"
  | "query_calendar"
  | "recommend"
  | "workload"
  | "weather"
  | "unknown";

export type Intent =
  | {
      kind: "create_task";
      title: string;
      dueAt: string | null;
      priority: string;
      estimatedMinutes: number | null;
    }
  | { kind: "capture_inbox"; content: string }
  | { kind: "start_focus"; taskQuery: string | null; durationMinutes: number | null }
  | { kind: "query_calendar"; range: "today" | "tomorrow" }
  | { kind: "recommend" }
  | { kind: "workload" }
  | { kind: "weather"; when: "today" | "tomorrow" }
  | { kind: "unknown"; text: string };

/** How the intent was derived — kept honest so the UI can show deterministic vs AI-interpreted. */
export type IntentSource = "deterministic" | "ai" | "none";

/** A resolved, previewable interpretation the UI shows BEFORE executing. */
export interface IntentPreview {
  intent: Intent;
  source: IntentSource;
  /** Human title for the preview card ("Create task", "Start focus"). */
  title: string;
  /** One-line description of what will happen. */
  summary: string;
  /** True when the intent can be executed as-is; false → needs clarification/unknown. */
  executable: boolean;
  /** Present when the request is ambiguous — the user must choose (never guess). */
  clarification?: { question: string; options: { id: string; label: string }[] };
  /** Whether executing is high-impact and should confirm (kept simple; creates are low-impact). */
  confirm: boolean;
  /** For READ intents (calendar/recommend/workload/weather) — the grounded answer to show. */
  answer?: string;
  /** Where to open for the full surface (read intents), or after executing. */
  navigateHref?: string;
}
