import {
  DEFAULT_SNOOZE_MINUTES,
  DEFAULT_TTL_MINUTES,
  TERMINAL_STATUSES,
  type NotificationStatus,
} from "./constants";
import { findDuplicate, refreshFromDraft } from "./deduplication";
import { decideDelivery } from "./delivery";
import { resolveEscalation } from "./priority";
import { schedule } from "./scheduler";
import { buildSummary } from "./selectors";
import { computeSignals } from "./signals";
import type {
  DeliveryDecision,
  Notification,
  NotificationDraft,
  NotificationPreferences,
  ScheduleDecision,
} from "./types";

/**
 * NotificationEngine (Sprint 3.3). The platform engine that turns module signals into
 * notifications and runs their lifecycle. PURE — ids + clock are injected, no IO. It
 * holds NO feature logic: rules produce drafts, the engine dedupes/schedules/delivers
 * and advances the lifecycle deterministically.
 *
 * Lifecycle: generated → scheduled → delivered → seen → snoozed → delivered again →
 * completed → archived; plus dismiss / cancel / expire.
 */
export class NotificationTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotificationTransitionError";
  }
}

export interface NotificationEngineDeps {
  newId: () => string;
  now: () => Date;
}

function assertActive(n: Notification): void {
  if (TERMINAL_STATUSES.includes(n.status)) {
    throw new NotificationTransitionError(`Notification is already ${n.status}`);
  }
}

export class NotificationEngine {
  constructor(private readonly deps: NotificationEngineDeps) {}

  private clock(): Date {
    return this.deps.now();
  }

  /** Materialise a draft into a fresh notification (status: generated). */
  create(draft: NotificationDraft): Notification {
    const now = this.clock();
    const nowIso = now.toISOString();
    const ttl = draft.ttlMinutes ?? DEFAULT_TTL_MINUTES;
    return {
      id: this.deps.newId(),
      type: draft.type,
      priority: draft.priority,
      status: "generated",
      title: draft.title,
      reason: draft.reason,
      source: draft.source,
      dedupeKey: draft.dedupeKey,
      trigger: draft.trigger,
      condition: draft.condition,
      payload: draft.payload ?? {},
      sourceHref: draft.sourceHref ?? null,
      createdAt: nowIso,
      scheduledFor: draft.scheduledFor ?? null,
      deliveredAt: null,
      seenAt: null,
      snoozedUntil: null,
      snoozeCount: 0,
      completedAt: null,
      expiresAt: draft.expiresAt ?? new Date(now.getTime() + ttl * 60_000).toISOString(),
      channels: [],
      escalation: resolveEscalation(draft.priority, 0),
      updatedAt: nowIso,
    };
  }

  /**
   * Reconcile a batch of drafts against existing notifications. Deduplicated drafts
   * refresh the existing record; new ones are created. Returns { created, refreshed }.
   */
  reconcile(
    drafts: NotificationDraft[],
    existing: Notification[],
  ): { created: Notification[]; refreshed: Notification[] } {
    const now = this.clock();
    const created: Notification[] = [];
    const refreshed: Notification[] = [];
    // Track newly-created within this batch so two identical drafts collapse.
    const pool = [...existing];
    for (const draft of drafts) {
      const dup = findDuplicate(pool, draft);
      if (dup) {
        refreshed.push(refreshFromDraft(dup, draft, now));
      } else {
        const n = this.create(draft);
        created.push(n);
        pool.push(n);
      }
    }
    return { created, refreshed };
  }

  private touch(n: Notification, patch: Partial<Notification>): Notification {
    return { ...n, ...patch, updatedAt: this.clock().toISOString() };
  }

  /** generated → scheduled with a concrete deliver time. */
  markScheduled(n: Notification, deliverAt: string | null): Notification {
    assertActive(n);
    return this.touch(n, { status: "scheduled", scheduledFor: deliverAt });
  }

  /** → delivered, recording the channels the Platform layer will use. */
  markDelivered(n: Notification, decision: DeliveryDecision): Notification {
    assertActive(n);
    const now = this.clock();
    return this.touch(n, {
      status: "delivered",
      deliveredAt: now.toISOString(),
      channels: decision.channels,
      escalation: decision.escalation,
      snoozedUntil: null,
    });
  }

  /** delivered → seen (opened but not acted on). */
  markSeen(n: Notification): Notification {
    assertActive(n);
    return this.touch(n, { status: "seen", seenAt: this.clock().toISOString() });
  }

  /** Snooze for `minutes`; re-delivers after. Escalation climbs with snooze count. */
  snooze(n: Notification, minutes = DEFAULT_SNOOZE_MINUTES): Notification {
    assertActive(n);
    const now = this.clock();
    const until = new Date(now.getTime() + Math.max(1, minutes) * 60_000).toISOString();
    const snoozeCount = n.snoozeCount + 1;
    return this.touch(n, {
      status: "snoozed",
      snoozedUntil: until,
      snoozeCount,
      escalation: resolveEscalation(n.priority, snoozeCount),
    });
  }

  /** Resolve as done. */
  complete(n: Notification): Notification {
    assertActive(n);
    return this.touch(n, { status: "completed", completedAt: this.clock().toISOString() });
  }

  /** User dismissed without completing. */
  dismiss(n: Notification): Notification {
    assertActive(n);
    return this.touch(n, { status: "dismissed" });
  }

  /** System-cancelled (the underlying condition cleared before delivery). */
  cancel(n: Notification): Notification {
    assertActive(n);
    return this.touch(n, { status: "cancelled" });
  }

  /** Expired unseen. */
  expire(n: Notification): Notification {
    return this.touch(n, { status: "expired" });
  }

  /** Archive a resolved notification (out of the active list, kept in history). */
  archive(n: Notification): Notification {
    return this.touch(n, { status: "archived" });
  }

  // ── Read models ────────────────────────────────────────────────────────────
  schedule(
    n: Notification,
    ctx: {
      timezone: string;
      prefs: NotificationPreferences;
      workingHours?: { start: string; end: string };
    },
  ): ScheduleDecision {
    return schedule(n, { ...ctx, now: this.clock() });
  }

  decideDelivery(n: Notification, prefs: NotificationPreferences): DeliveryDecision {
    return decideDelivery(n, prefs);
  }

  summary(notifications: Notification[], muted: boolean, inQuietHours: boolean) {
    return buildSummary(notifications, this.clock(), muted, inQuietHours);
  }

  signals(notifications: Notification[], prefs: NotificationPreferences, timezone: string) {
    return computeSignals({ notifications, prefs, now: this.clock(), timezone });
  }
}

export function createNotificationEngine(
  newId: () => string,
  now: () => Date = () => new Date(),
): NotificationEngine {
  return new NotificationEngine({ newId, now });
}

export function isTerminalStatus(status: NotificationStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
