import "server-only";
import type { Database } from "@myos/db";
import { authUsers } from "@myos/db/schema";
import type { Notification } from "@myos/core/notification";
import type { ProactiveAction } from "@myos/core/proactive";
import * as notifRepo from "../notification/repository";
import * as notifService from "../notification/service";
import * as identityRepo from "../identity/repository";
import { proactiveDrafts, type ProactivePrefs } from "./gather";
import { getEnabled, setEnabled } from "./repository";

export { proactiveDrafts };

/**
 * Proactive service (Stage 6). The evaluation itself is folded into the Notification
 * engine's `generate` (one engine, one dedup, one lifecycle, one surface) — see
 * `proactiveDrafts`. This service adds the READ seams the UI consumes (the proactive
 * subset of notifications, the single top intervention for the Command Center) plus the
 * user's on/off control and an explicit `evaluate` trigger for the worker/internal route.
 */

/** A proactive intervention as the UI consumes it (notification + parsed action/detail). */
export interface ProactiveInterventionView {
  id: string;
  kind: string;
  title: string;
  reason: string;
  priority: Notification["priority"];
  status: Notification["status"];
  detail: string[];
  action: ProactiveAction | null;
  sourceHref: string | null;
  confidence: number | null;
  createdAt: string;
}

function toView(n: Notification): ProactiveInterventionView {
  const payload = n.payload as {
    action?: ProactiveAction | null;
    detail?: string[];
    kind?: string;
    confidence?: number;
  };
  return {
    id: n.id,
    kind: payload.kind ?? n.condition,
    title: n.title,
    reason: n.reason,
    priority: n.priority,
    status: n.status,
    detail: Array.isArray(payload.detail) ? payload.detail : [],
    action: payload.action ?? null,
    sourceHref: n.sourceHref,
    confidence: typeof payload.confidence === "number" ? payload.confidence : null,
    createdAt: n.createdAt,
  };
}

/** All active proactive interventions (the notification center's "OS Interventions" group). */
export async function interventions(db: Database): Promise<ProactiveInterventionView[]> {
  const active = await notifRepo.listActive(db).catch(() => []);
  return active
    .filter((n) => n.source === "proactive")
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map(toView);
}

/** The single most important active proactive intervention — for the Command Center card. */
export async function forCommandCenter(
  db: Database,
): Promise<{ intervention: ProactiveInterventionView | null; enabled: boolean }> {
  const [active, enabled] = await Promise.all([
    notifRepo.listActive(db).catch(() => []),
    getEnabled(db).catch(() => true),
  ]);
  const rank: Record<Notification["priority"], number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    silent: 0,
  };
  const top = active
    .filter((n) => n.source === "proactive")
    .sort(
      (a, b) =>
        rank[b.priority] - rank[a.priority] || Date.parse(b.createdAt) - Date.parse(a.createdAt),
    )[0];
  return { intervention: top ? toView(top) : null, enabled };
}

/** adaptation-style settings read. */
export async function settings(db: Database): Promise<{ enabled: boolean }> {
  return { enabled: await getEnabled(db).catch(() => true) };
}

export async function setProactiveEnabled(
  db: Database,
  enabled: boolean,
): Promise<{ enabled: boolean }> {
  return { enabled: await setEnabled(db, enabled) };
}

/**
 * Run one proactive evaluation cycle. Delegates to the Notification engine's `generate`
 * (which now folds in the proactive drafts), so this is the single always-on entry point
 * the worker cron / internal route calls. Returns the generation summary.
 */
export async function evaluate(
  db: Database,
  tz: string,
  prefs: ProactivePrefs,
  now = new Date(),
): Promise<{ created: number; delivered: number; suppressed: number }> {
  return notifService.generate(db, tz, now, prefs);
}

/**
 * Always-on entry point for the worker/internal route (no request session). Resolves the
 * single owner's timezone + day preferences directly from the DB, then evaluates. Honest:
 * returns `{ skipped }` when there is no owner yet.
 */
export async function evaluateForOwner(
  db: Database,
  now = new Date(),
): Promise<{ created: number; delivered: number; suppressed: number; skipped?: string }> {
  const [owner] = await db.select({ id: authUsers.id }).from(authUsers).limit(1);
  if (!owner) return { created: 0, delivered: 0, suppressed: 0, skipped: "no-owner" };
  const prefs = await identityRepo.getPreferences(db, owner.id).catch(() => null);
  const tz = prefs?.timezone ?? "UTC";
  return evaluate(
    db,
    tz,
    {
      preferredStartOfDay: prefs?.preferredStartOfDay ?? "09:00",
      preferredEndOfDay: prefs?.preferredEndOfDay ?? "17:00",
    },
    now,
  );
}
