import "server-only";
import type { Database } from "@myos/db";
import {
  evaluateProactive,
  type ProactiveAction,
  type ProactiveContext,
  type ProactiveIntervention,
  type ProactiveSignalInput,
} from "@myos/core/proactive";
import type {
  NotificationDraft,
  NotificationPriority,
  NotificationType,
} from "@myos/core/notification";
import { selectActionable } from "@myos/core/decision";
import { todayInTimeZone } from "@myos/core/today";
import { resolveSignalTarget, type IntelTarget } from "../../lib/intelligence/actions";
import * as signalsService from "../signals/service";
import * as adaptationService from "../adaptation/service";
import * as decisionService from "../decision/service";
import * as inboxService from "../inbox/service";
import * as notifRepo from "../notification/repository";
import { getEnabled } from "./repository";

/**
 * Proactive context gathering (Stage 6). READ-ONLY. Assembles the deterministic
 * `ProactiveContext` the pure evaluator consumes, entirely from intelligence the
 * existing engines already produced — ranked Signals (6.1, fed by Predictions 6.2 +
 * Connectors 6.4), Stage 5 workload realism, actionable Decisions, inbox state — plus
 * the resolved-condition history that powers cooldown. Actions are pre-resolved here via
 * the existing intelligence→action resolver, so the pure core stays dependency-free.
 * Every read `.catch`es to degrade gracefully: a failing source is simply silent.
 */

export interface ProactivePrefs {
  preferredStartOfDay: string;
  preferredEndOfDay: string;
}

/** IntelTarget → ProactiveAction (identical shapes; keeps the core type dependency-free). */
function toAction(target: IntelTarget | null): ProactiveAction | null {
  if (!target) return null;
  return target.kind === "focus"
    ? { kind: "focus", taskId: target.taskId, label: target.label }
    : { kind: "navigate", href: target.href, label: target.label };
}

function minutesSince(iso: string, now: Date): number {
  return (now.getTime() - Date.parse(iso)) / 60_000;
}

export async function gatherProactiveContext(
  db: Database,
  tz: string,
  prefs: ProactivePrefs,
  now = new Date(),
): Promise<ProactiveContext> {
  const date = todayInTimeZone(tz);

  const [enabled, signalsResult, plan, decisions, inboxItems, allNotifs] = await Promise.all([
    getEnabled(db).catch(() => true),
    signalsService.current(db, tz).catch(() => ({ signals: [] as never[] })),
    adaptationService.todayPlan(db, tz, prefs).catch(() => null),
    decisionService.list(db, date, 50).catch(() => []),
    inboxService.list(db, { status: "new" }).catch(() => []),
    notifRepo.listAll(db, 200).catch(() => []),
  ]);

  // Signals → the evaluator's projection, with each action pre-resolved.
  const signals: ProactiveSignalInput[] = signalsResult.signals.map((s) => ({
    id: s.id,
    category: s.category,
    severity: s.severity,
    notify: s.notify,
    priorityScore: s.ranking.priority,
    confidence: s.confidence,
    headline: s.explanation.headline,
    reasons: s.explanation.reasons,
    implication: s.explanation.implication,
    dedupeKey: s.dedupeKey,
    action: toAction(resolveSignalTarget(s.relatedObjects)),
    expiresAt: s.expiresAt,
  }));

  // Workload realism (Stage 5) — the overloaded-day signal.
  const workload = plan
    ? {
        overloaded: plan.overloaded,
        overBy: plan.overBy,
        expectedMinutes: plan.expectedMinutes,
        realisticCapacityMinutes: plan.realisticCapacityMinutes,
        reasons: plan.reasons,
        headline: plan.headline,
        confidenceLevel: plan.confidence.level,
        deferSuggestions: plan.deferSuggestions,
      }
    : null;

  // Actionable decisions blocking planned work.
  const actionable = selectActionable(decisions, now);
  const oldestDecisionAge = actionable.length
    ? Math.max(...actionable.map((d) => minutesSince(d.createdAt, now)))
    : null;

  // Inbox accumulation.
  const oldestInboxAge = inboxItems.length
    ? Math.max(...inboxItems.map((i) => minutesSince(i.capturedAt, now)))
    : null;

  // Resolved-condition history → cooldown (dismissed/completed notifications, by key).
  const recentlyResolved = allNotifs
    .filter((n) => n.status === "dismissed" || n.status === "completed")
    .map((n) => ({
      dedupeKey: n.dedupeKey,
      resolvedAt: n.completedAt ?? n.updatedAt,
      status: (n.status === "completed" ? "completed" : "dismissed") as "completed" | "dismissed",
    }));

  return {
    now,
    enabled,
    signals,
    workload,
    decisions: { actionableCount: actionable.length, oldestAgeMinutes: oldestDecisionAge },
    inbox: { unread: inboxItems.length, oldestAgeMinutes: oldestInboxAge },
    recentlyResolved,
  };
}

/** navigate → its href; focus → the Focus surface; nothing → no link. */
function hrefFor(action: ProactiveAction | null): string | null {
  if (!action) return null;
  return action.kind === "navigate" ? action.href : "/focus";
}

/**
 * The Notification-engine draft set for the current proactive cycle. Folded into the
 * Notification engine's `generate` so proactive interventions flow through the identical
 * dedup / schedule / deliver / lifecycle path as every other notification. Kept here (not
 * in service.ts) so `notification/service` can import it without a cycle.
 */
export async function proactiveDrafts(
  db: Database,
  tz: string,
  prefs: ProactivePrefs,
  now = new Date(),
): Promise<NotificationDraft[]> {
  const ctx = await gatherProactiveContext(db, tz, prefs, now);
  return evaluateProactive(ctx).map(interventionToDraft);
}

/** Map an intervention onto a Notification draft (proactive interventions ARE notifications). */
export function interventionToDraft(i: ProactiveIntervention): NotificationDraft {
  return {
    type: i.category as NotificationType,
    priority: i.priority as NotificationPriority,
    title: i.title,
    reason: i.reason,
    source: "proactive",
    dedupeKey: i.dedupeKey,
    trigger: "proactive_evaluation",
    condition: i.kind,
    payload: { action: i.action, detail: i.detail, kind: i.kind, confidence: i.confidence },
    sourceHref: hrefFor(i.action),
    ttlMinutes: i.ttlMinutes,
  };
}
