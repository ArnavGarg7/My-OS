import "server-only";
import { randomUUID } from "node:crypto";
import {
  BUILTIN_AUTOMATIONS,
  completeRecord,
  createAutomationEngine,
  makeTrigger,
  outcomeRecord,
  planExecution,
  startRecord,
  validateAutomation,
  type AutomationDraft,
  type AutomationPreview,
  type AutomationRule,
  type AutomationSummary,
  type ExecutionRecord,
  type TriggerEvent,
} from "@myos/core/automation";
import { todayInTimeZone } from "@myos/core/today";
import type { Database } from "@myos/db";
import { buildSummary } from "@myos/core/automation";
import * as repo from "./repository";
import { dispatchAction } from "./executor";
import { ruleStatistics } from "./statistics";

/**
 * AutomationService (Sprint 3.4). Orchestrates the pure AutomationEngine over
 * persistence + the server action executor. `execute` runs a rule now: plan (match →
 * conditions → schedule) → dispatch actions to existing services → record history →
 * refresh statistics. It holds NO feature logic — actions call the feature engines.
 */
const engine = createAutomationEngine(
  () => randomUUID(),
  () => new Date(),
);

interface Prefs {
  preferredStartOfDay: string;
  preferredEndOfDay: string;
  timezone: string;
}

export function list(db: Database): Promise<AutomationRule[]> {
  return repo.list(db);
}

export function get(db: Database, id: string): Promise<AutomationRule | null> {
  return repo.getById(db, id);
}

export async function create(db: Database, draft: AutomationDraft): Promise<AutomationRule> {
  const existing = await repo.list(db);
  const result = validateAutomation(draft, existing);
  if (!result.valid) {
    throw new Error(result.issues.map((i) => i.message).join(" "));
  }
  const rule = engine.enable(engine.createRule(draft));
  return repo.insert(db, rule);
}

export async function update(
  db: Database,
  id: string,
  patch: Partial<AutomationDraft>,
): Promise<AutomationRule> {
  const current = await repo.getById(db, id);
  if (!current) throw new Error("Automation rule not found");
  const updated = engine.update(current, patch);
  const existing = (await repo.list(db)).filter((r) => r.id !== id);
  const result = validateAutomation(updated, existing);
  if (!result.valid) throw new Error(result.issues.map((i) => i.message).join(" "));
  return repo.update(db, updated);
}

export async function remove(db: Database, id: string): Promise<{ id: string }> {
  const current = await repo.getById(db, id);
  if (current?.builtIn) throw new Error("Built-in rules cannot be deleted (disable instead).");
  await repo.remove(db, id);
  return { id };
}

export async function enable(db: Database, id: string): Promise<AutomationRule> {
  await repo.setStatus(db, id, "enabled");
  return (await repo.getById(db, id))!;
}

export async function disable(db: Database, id: string): Promise<AutomationRule> {
  await repo.setStatus(db, id, "disabled");
  return (await repo.getById(db, id))!;
}

async function buildContext(db: Database, prefs: Prefs, now: Date) {
  const [focusActive, planner] = await Promise.all([
    focusActiveSafe(db),
    plannerGeneratedSafe(db, prefs.timezone),
  ]);
  return {
    now,
    timezone: prefs.timezone,
    workingHours: { start: prefs.preferredStartOfDay, end: prefs.preferredEndOfDay },
    quietHours: { enabled: true, start: "22:00", end: "07:00" },
    focusSessionActive: focusActive,
    plannerGenerated: planner,
  };
}

async function focusActiveSafe(db: Database): Promise<boolean> {
  try {
    const { active } = await import("../focus/service");
    return (await active(db)) !== null;
  } catch {
    return false;
  }
}

async function plannerGeneratedSafe(db: Database, tz: string): Promise<boolean> {
  try {
    const { listBlocks } = await import("../planner/repository");
    const blocks = await listBlocks(db, todayInTimeZone(tz));
    return blocks.length > 0;
  } catch {
    return false;
  }
}

/** Execute a single rule now (manual run or matched trigger). */
export async function execute(
  db: Database,
  id: string,
  prefs: Prefs,
  payload: Record<string, unknown> = {},
  now = new Date(),
): Promise<ExecutionRecord> {
  const rule = await repo.getById(db, id);
  if (!rule) throw new Error("Automation rule not found");

  const event = makeTrigger(randomUUID(), rule.trigger.kind, rule.trigger.event, now, payload, {
    origin: "manual",
  });
  const context = await buildContext(db, prefs, now);
  const history = await repo.allHistory(db);
  const plan = planExecution({ rule, event, context, history });

  let record = startRecord(randomUUID(), rule.id, now);

  if (!plan.shouldExecute) {
    const outcome = plan.triggerMatched && plan.conditionsPassed ? "skipped" : "conditions_failed";
    record = outcomeRecord(record, outcome, new Date(), plan.reason);
    await repo.recordExecution(db, record);
    await ruleStatistics(db, rule.id);
    return record;
  }

  const results = [];
  for (const action of plan.actions) {
    results.push(await dispatchAction(action, { db, tz: prefs.timezone, prefs }));
  }
  record = completeRecord(record, new Date(), results);
  await repo.recordExecution(db, record);
  await ruleStatistics(db, rule.id);
  return record;
}

/** Fire a trigger event: run every matched, enabled rule (ordered by priority). */
export async function fire(
  db: Database,
  event: TriggerEvent,
  prefs: Prefs,
  now = new Date(),
): Promise<ExecutionRecord[]> {
  const rules = await repo.list(db);
  const plans = engine.planForEvent(
    rules,
    event,
    await buildContext(db, prefs, now),
    await repo.allHistory(db),
  );
  const records: ExecutionRecord[] = [];
  for (const { rule } of plans) {
    records.push(await execute(db, rule.id, prefs, event.payload, now));
  }
  return records;
}

export function history(db: Database, ruleId: string | undefined, limit = 100) {
  return repo.listHistory(db, ruleId, limit);
}

export function statistics(db: Database, ruleId: string) {
  return ruleStatistics(db, ruleId);
}

export async function validate(db: Database, draft: AutomationDraft) {
  const existing = await repo.list(db);
  return validateAutomation(draft, existing);
}

export async function preview(
  db: Database,
  input: { id?: string; draft?: AutomationDraft; payload?: Record<string, unknown> },
  prefs: Prefs,
  now = new Date(),
): Promise<AutomationPreview> {
  let rule: AutomationRule | null = null;
  if (input.id) rule = await repo.getById(db, input.id);
  else if (input.draft) rule = engine.enable(engine.createRule(input.draft));
  if (!rule) throw new Error("Nothing to preview");

  const event = makeTrigger(
    randomUUID(),
    rule.trigger.kind,
    rule.trigger.event,
    now,
    input.payload ?? {},
    {},
  );
  return engine.preview(rule, event, await buildContext(db, prefs, now));
}

export async function summary(
  db: Database,
  tz: string,
  now = new Date(),
): Promise<AutomationSummary> {
  const [rules, hist] = await Promise.all([repo.list(db), repo.allHistory(db)]);
  return buildSummary(rules, hist, now, tz);
}

/** Seed the built-in automations if none exist yet (idempotent). */
export async function seedBuiltins(db: Database): Promise<number> {
  const existing = await repo.list(db);
  if (existing.some((r) => r.builtIn)) return 0;
  let created = 0;
  for (const draft of BUILTIN_AUTOMATIONS) {
    const rule = engine.enable(engine.createRule(draft));
    await repo.insert(db, rule);
    created += 1;
  }
  return created;
}
