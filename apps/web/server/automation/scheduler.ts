import "server-only";
import { scheduleRule, type AutomationRule, type ExecutionRecord } from "@myos/core/automation";
import type { Database } from "@myos/db";
import { allHistory } from "./repository";

/**
 * Server scheduler (Sprint 3.4). Thin coordinator over the PURE core scheduler. Given
 * the current time + a rule's persisted history, decides whether it may run now. No
 * timers — runs on demand (execute / cron trigger). The core does the math.
 */
export async function scheduleFor(
  db: Database,
  rule: AutomationRule,
  tz: string,
  now = new Date(),
): Promise<ReturnType<typeof scheduleRule>> {
  const history = await allHistory(db).catch(() => [] as ExecutionRecord[]);
  return scheduleRule(rule, { now, timezone: tz, history });
}
