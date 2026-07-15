import {
  DEFAULT_COOLDOWN_MINUTES,
  DEFAULT_DELAY_MINUTES,
  DEFAULT_MAX_EXECUTIONS,
  DEFAULT_RETRY_ATTEMPTS,
  DEFAULT_RETRY_BACKOFF_MINUTES,
  DEFAULT_THROTTLE_MINUTES,
} from "./constants";
import { parseHHMM, minutesOfDayInTz } from "../notification/quiet-hours";
import type { AutomationRule, AutomationScheduleResult, ExecutionRecord } from "./types";

/**
 * Automation scheduler (Sprint 3.4). PURE — no timers, only calculations. Given a
 * rule, the current time and its execution history, decide whether it runs now:
 * run / delay / skip / cooldown / retry. Every policy is deterministic.
 */
const MIN_MS = 60_000;

function ms(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

function todayKey(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date(iso));
}

export interface ScheduleContext {
  now: Date;
  timezone: string;
  history: ExecutionRecord[];
}

export function scheduleRule(rule: AutomationRule, ctx: ScheduleContext): AutomationScheduleResult {
  const { policy } = rule;
  const nowMs = ctx.now.getTime();
  const runs = ctx.history.filter((h) => h.ruleId === rule.id);
  const completed = runs.filter((h) => h.outcome === "completed");
  const lastRun = runs.length > 0 ? runs[runs.length - 1] : null;
  const lastCompletedAt =
    completed.length > 0 ? ms(completed[completed.length - 1]!.triggeredAt) : null;

  switch (policy.policy) {
    case "run_once":
      return completed.length > 0
        ? { decision: "skip", runAt: null, reason: "Already run once." }
        : { decision: "run", runAt: ctx.now.toISOString(), reason: "First run." };

    case "run_always":
      return { decision: "run", runAt: ctx.now.toISOString(), reason: "Always runs." };

    case "cooldown": {
      const cd = (policy.cooldownMinutes ?? DEFAULT_COOLDOWN_MINUTES) * MIN_MS;
      if (lastCompletedAt !== null && nowMs - lastCompletedAt < cd) {
        return {
          decision: "cooldown",
          runAt: new Date(lastCompletedAt + cd).toISOString(),
          reason: "Within cooldown window.",
        };
      }
      return { decision: "run", runAt: ctx.now.toISOString(), reason: "Cooldown elapsed." };
    }

    case "throttle": {
      const window = (policy.throttleMinutes ?? DEFAULT_THROTTLE_MINUTES) * MIN_MS;
      const lastAt = lastRun ? ms(lastRun.triggeredAt) : null;
      if (lastAt !== null && nowMs - lastAt < window) {
        return { decision: "skip", runAt: null, reason: "Throttled." };
      }
      return { decision: "run", runAt: ctx.now.toISOString(), reason: "Throttle window clear." };
    }

    case "max_executions": {
      const max = policy.maxExecutions ?? DEFAULT_MAX_EXECUTIONS;
      if (completed.length >= max) {
        return { decision: "skip", runAt: null, reason: "Max executions reached." };
      }
      return { decision: "run", runAt: ctx.now.toISOString(), reason: "Under execution cap." };
    }

    case "retry": {
      const attempts = policy.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS;
      const backoff = (policy.retryBackoffMinutes ?? DEFAULT_RETRY_BACKOFF_MINUTES) * MIN_MS;
      const recentFailures = runs.filter((h) => h.outcome === "failed");
      if (recentFailures.length === 0) {
        return { decision: "run", runAt: ctx.now.toISOString(), reason: "No prior failure." };
      }
      if (recentFailures.length >= attempts) {
        return { decision: "skip", runAt: null, reason: "Retry attempts exhausted." };
      }
      const lastFailAt = ms(recentFailures[recentFailures.length - 1]!.triggeredAt);
      if (lastFailAt !== null && nowMs - lastFailAt < backoff) {
        return {
          decision: "retry",
          runAt: new Date(lastFailAt + backoff).toISOString(),
          reason: "Waiting for retry backoff.",
        };
      }
      return { decision: "run", runAt: ctx.now.toISOString(), reason: "Retry backoff elapsed." };
    }

    case "delay": {
      const delay = (policy.delayMinutes ?? DEFAULT_DELAY_MINUTES) * MIN_MS;
      return {
        decision: "delay",
        runAt: new Date(nowMs + delay).toISOString(),
        reason: "Delayed run.",
      };
    }

    case "schedule": {
      if (!policy.scheduleAt) {
        return { decision: "run", runAt: ctx.now.toISOString(), reason: "No schedule set." };
      }
      const target = parseHHMM(policy.scheduleAt);
      const nowMin = minutesOfDayInTz(ctx.now, ctx.timezone);
      const ranToday = runs.some(
        (h) =>
          todayKey(h.triggeredAt, ctx.timezone) === todayKey(ctx.now.toISOString(), ctx.timezone),
      );
      if (ranToday) return { decision: "skip", runAt: null, reason: "Already ran today." };
      if (nowMin >= target)
        return { decision: "run", runAt: ctx.now.toISOString(), reason: "Scheduled time reached." };
      const delayMin = target - nowMin;
      return {
        decision: "delay",
        runAt: new Date(nowMs + delayMin * MIN_MS).toISOString(),
        reason: "Before scheduled time.",
      };
    }

    case "manual_approval":
      return { decision: "skip", runAt: null, reason: "Awaiting manual approval." };

    default:
      return { decision: "run", runAt: ctx.now.toISOString(), reason: "Default run." };
  }
}
