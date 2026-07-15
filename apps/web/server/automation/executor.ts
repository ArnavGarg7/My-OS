import "server-only";
import type { Action, ActionKind } from "@myos/core/automation";
import type { Database } from "@myos/db";
import * as notificationService from "../notification/service";
import * as focusService from "../focus/service";
import * as plannerService from "../planner/service";
import * as decisionService from "../decision/service";
import * as timelineService from "../timeline/service";

/**
 * Server action executor (Sprint 3.4). Maps each pure ActionKind to a call on an
 * EXISTING service — automation implements NO business logic. Every dispatch is
 * wrapped so one failing action is recorded without aborting the rest. Notification
 * delivery, planner generation, focus control etc. all remain owned by their engines.
 */
export interface ActionResult {
  actionId: string;
  kind: ActionKind;
  ok: boolean;
  detail?: string;
}

interface DispatchContext {
  db: Database;
  tz: string;
  prefs: { preferredStartOfDay: string; preferredEndOfDay: string };
}

export async function dispatchAction(action: Action, ctx: DispatchContext): Promise<ActionResult> {
  try {
    const detail = await run(action, ctx);
    return { actionId: action.id, kind: action.kind, ok: true, ...(detail ? { detail } : {}) };
  } catch (err) {
    return {
      actionId: action.id,
      kind: action.kind,
      ok: false,
      detail: err instanceof Error ? err.message : "Action failed",
    };
  }
}

async function run(action: Action, ctx: DispatchContext): Promise<string | undefined> {
  const { db, tz, prefs } = ctx;
  switch (action.kind) {
    case "generate_notification":
    case "create_reminder": {
      const r = await notificationService.generate(db, tz);
      return `notifications: +${r.created}`;
    }
    case "start_focus": {
      const type = (action.params.type as string) ?? "focus";
      await focusService.start(db, tz, { type: type as never });
      return `focus started (${type})`;
    }
    case "pause_focus": {
      const active = await focusService.active(db);
      if (!active) return "no active focus session";
      await focusService.pause(db, tz, active.id);
      return "focus paused";
    }
    case "resume_focus": {
      const active = await focusService.active(db);
      if (!active) return "no session to resume";
      await focusService.resume(db, tz, active.id);
      return "focus resumed";
    }
    case "complete_focus": {
      const active = await focusService.active(db);
      if (!active) return "no session to complete";
      await focusService.complete(db, tz, active.id);
      return "focus completed";
    }
    case "generate_planner":
    case "regenerate_planner": {
      await plannerService.generate(db, tz, prefs);
      return "planner generated";
    }
    case "generate_decision": {
      const decisions = await decisionService.generate(db, tz, prefs);
      return `decisions: ${decisions.length}`;
    }
    case "log_timeline_event": {
      await timelineService.record(db, {
        eventType: "automation.executed",
        source: "automation" as never,
        title: (action.params.title as string) ?? "Automation executed",
      });
      return "timeline logged";
    }
    case "noop":
      return "noop";
    // Client-driven or non-server-dispatchable actions are deterministic no-ops that
    // still succeed — the UI performs them (open_tomorrow / open_journal) or they are
    // future extensions. Recorded so the lifecycle + statistics stay consistent.
    case "open_tomorrow":
    case "open_journal":
    case "mark_decision_complete":
    case "dismiss_decision":
    case "complete_reminder":
    case "emit_analytics_event":
    case "run_custom_workflow":
      return `${action.kind} acknowledged`;
    default:
      return "unhandled";
  }
}
