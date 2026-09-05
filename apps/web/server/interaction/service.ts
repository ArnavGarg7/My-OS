import "server-only";
import type { Database } from "@myos/db";
import {
  parseIntent,
  type Intent,
  type IntentPreview,
  type IntentSource,
} from "@myos/core/interaction";
import { parseTask } from "@myos/core/task";
import * as taskService from "../task/service";
import * as inboxService from "../inbox/service";
import * as focusService from "../focus/service";
import * as calendarService from "../calendar/service";
import * as chiefService from "../chief/service";
import * as adaptationService from "../adaptation/service";
import { currentWeather } from "../connectors/weather";
import { classifyIntent } from "./ai-intent";

/**
 * Interaction service (Stage 9). Turns natural language into a validated, previewable intent
 * and — on explicit confirm — executes it through the EXISTING capabilities. Deterministic
 * parser first (no AI cost); AI fallback only when it misses. AI is never the source of
 * truth: every target is resolved against real server data here, ambiguity asks for
 * clarification (never guesses), and reads return grounded answers. The OS works even if AI
 * is unavailable. `name`/`prefs` come from the identity on the context.
 */

export interface DayPrefs {
  preferredStartOfDay: string;
  preferredEndOfDay: string;
}

export interface InterpretInput {
  text: string;
  name: string;
  prefs: DayPrefs;
  /** Optional saved location for weather (client-provided; honest "unavailable" without it). */
  location?: string | null;
}

function base(intent: Intent, source: IntentSource, over: Partial<IntentPreview>): IntentPreview {
  return {
    intent,
    source,
    title: over.title ?? "Interpretation",
    summary: over.summary ?? "",
    executable: over.executable ?? false,
    confirm: over.confirm ?? false,
    ...(over.clarification ? { clarification: over.clarification } : {}),
    ...(over.answer !== undefined ? { answer: over.answer } : {}),
    ...(over.navigateHref !== undefined ? { navigateHref: over.navigateHref } : {}),
  };
}

async function preview(
  db: Database,
  tz: string,
  intent: Intent,
  source: IntentSource,
  input: InterpretInput,
): Promise<IntentPreview> {
  const now = new Date();
  switch (intent.kind) {
    case "create_task": {
      const due = intent.dueAt ? ` · due ${new Date(intent.dueAt).toLocaleDateString()}` : "";
      const est = intent.estimatedMinutes ? ` · ${intent.estimatedMinutes}m` : "";
      return base(intent, source, {
        title: "Create task",
        summary: `${intent.title}${due}${est}`,
        executable: true,
      });
    }
    case "capture_inbox":
      return base(intent, source, {
        title: "Capture to Inbox",
        summary: intent.content,
        executable: true,
      });
    case "start_focus": {
      const duration = intent.durationMinutes ?? 25;
      if (intent.taskQuery) {
        const matches = await taskService.search(db, intent.taskQuery).catch(() => []);
        const open = matches.filter((t) => t.status !== "completed");
        if (open.length > 1) {
          return base(intent, source, {
            title: "Start focus",
            summary: `Which task? (${duration}m)`,
            executable: false,
            clarification: {
              question: `Multiple tasks match "${intent.taskQuery}". Which one?`,
              options: open.slice(0, 6).map((t) => ({ id: t.id, label: t.title })),
            },
          });
        }
        const task = open[0];
        return base(intent, source, {
          title: "Start focus",
          summary: task
            ? `${duration}m on "${task.title}"`
            : `${duration}m (no matching task — general session)`,
          executable: true,
        });
      }
      return base(intent, source, {
        title: "Start focus",
        summary: `${duration}m deep work session`,
        executable: true,
      });
    }
    case "query_calendar": {
      const day = intent.range === "tomorrow" ? new Date(now.getTime() + 86_400_000) : now;
      const from = new Date(day);
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      const events = await calendarService
        .list(db, { from: from.toISOString(), to: to.toISOString() })
        .catch(() => []);
      const answer =
        events.length === 0
          ? `No events ${intent.range}.`
          : `${events.length} event${events.length === 1 ? "" : "s"} ${intent.range}: ` +
            events
              .slice(0, 4)
              .map(
                (e) =>
                  `${e.title} (${new Date(e.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
              )
              .join(", ");
      return base(intent, source, {
        title: "Calendar",
        summary: answer,
        answer,
        navigateHref: "/calendar",
      });
    }
    case "recommend": {
      const nowData = await chiefService.now(db, tz, input.name).catch(() => null);
      const rec = nowData?.recommendation as
        { title?: string; rationale?: string; summary?: string } | null | undefined;
      const recText = rec?.title ?? rec?.summary;
      const answer = recText
        ? `${recText}${rec?.rationale ? ` — ${rec.rationale}` : ""}`
        : "Nothing pressing right now.";
      return base(intent, source, {
        title: "My OS recommends",
        summary: answer,
        answer,
        navigateHref: "/command-center",
      });
    }
    case "workload": {
      const plan = await adaptationService.todayPlan(db, tz, input.prefs).catch(() => null);
      const answer = plan
        ? plan.overloaded
          ? `${plan.headline} — expected ${plan.expectedMinutes}m vs ${plan.realisticCapacityMinutes}m capacity.`
          : "Your day looks realistic."
        : "Not enough data to assess your day yet.";
      return base(intent, source, {
        title: "Workload",
        summary: answer,
        answer,
        navigateHref: "/planner",
      });
    }
    case "weather": {
      const reading = await currentWeather(input.location ?? null);
      const answer =
        reading.status === "ok"
          ? `${reading.location}: ${reading.tempC}°C, ${reading.description} (feels ${reading.feelsLikeC}°C).`
          : (reading.message ?? "Weather unavailable.");
      return base(intent, source, { title: "Weather", summary: answer, answer });
    }
    default:
      return base(intent, source, {
        title: "Not understood",
        summary: "Try “add …”, “start focus …”, “what should I work on?”, or “weather”.",
        executable: false,
      });
  }
}

export async function interpret(
  db: Database,
  tz: string,
  input: InterpretInput,
): Promise<IntentPreview> {
  const text = input.text.trim();
  if (!text)
    return base({ kind: "unknown", text: "" }, "none", {
      title: "Not understood",
      summary: "Say or type a command.",
    });

  let intent = parseIntent(text, new Date());
  let source: IntentSource = "deterministic";
  if (!intent) {
    const ai = await classifyIntent(text).catch(() => null);
    if (ai) {
      intent = ai;
      source = "ai";
      // The AI classifies the KIND but its strict schema drops structured details
      // (it always returns dueAt:null). For task creation, re-run the deterministic
      // task parser on the ORIGINAL text so "buy groceries tomorrow" keeps its due
      // date / priority / estimate — parseTask stays the source of truth for task NL,
      // while we keep the AI's cleaner title.
      if (intent.kind === "create_task") {
        const draft = parseTask(text, new Date());
        intent = {
          kind: "create_task",
          title: intent.title || draft.title,
          dueAt: intent.dueAt ?? draft.dueAt ?? null,
          priority: draft.priority !== "medium" ? draft.priority : intent.priority,
          estimatedMinutes: intent.estimatedMinutes ?? draft.estimatedMinutes ?? null,
        };
      }
    } else {
      intent = { kind: "unknown", text };
      source = "none";
    }
  }
  return preview(db, tz, intent, source, input);
}

export interface ExecuteResult {
  ok: boolean;
  kind: Intent["kind"];
  message: string;
  navigateHref: string | null;
}

/**
 * Execute a previously-previewed intent through the existing capability. Server-authoritative:
 * targets are re-resolved here; read intents just navigate. `taskId` (from a clarification
 * choice) overrides the query when provided.
 */
export async function execute(
  db: Database,
  tz: string,
  intent: Intent,
  opts?: { taskId?: string | null; location?: string | null; name?: string },
): Promise<ExecuteResult> {
  switch (intent.kind) {
    case "create_task": {
      const task = await taskService.create(db, {
        title: intent.title,
        priority: intent.priority as never,
        ...(intent.dueAt ? { dueAt: intent.dueAt } : {}),
        ...(intent.estimatedMinutes ? { estimatedMinutes: intent.estimatedMinutes } : {}),
      });
      return {
        ok: true,
        kind: intent.kind,
        message: `Created "${task.title}"`,
        navigateHref: "/tasks",
      };
    }
    case "capture_inbox": {
      await inboxService.capture(db, {
        type: "text",
        content: intent.content,
        source: "quick_add",
      });
      return { ok: true, kind: intent.kind, message: "Captured to Inbox", navigateHref: "/inbox" };
    }
    case "start_focus": {
      let taskId = opts?.taskId ?? null;
      if (!taskId && intent.taskQuery) {
        const matches = (await taskService.search(db, intent.taskQuery).catch(() => [])).filter(
          (t) => t.status !== "completed",
        );
        if (matches.length === 1) taskId = matches[0]!.id;
      }
      await focusService.start(db, tz, {
        type: "focus",
        plannedMinutes: intent.durationMinutes ?? 25,
        ...(taskId ? { taskId } : {}),
      });
      return {
        ok: true,
        kind: intent.kind,
        message: "Focus session started",
        navigateHref: "/focus",
      };
    }
    default:
      return {
        ok: false,
        kind: intent.kind,
        message: "Nothing to run.",
        navigateHref:
          intent.kind === "query_calendar"
            ? "/calendar"
            : intent.kind === "workload"
              ? "/planner"
              : intent.kind === "recommend"
                ? "/command-center"
                : null,
      };
  }
}
