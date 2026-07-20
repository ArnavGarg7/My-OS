import "server-only";
import type { Database } from "@myos/db";
import { ToolRegistry, type ToolPlugin } from "@myos/ai/tools";
import { nowRecommendation } from "@myos/ai/chief";
import { composeChiefContext } from "../chief/composer";
import * as taskService from "../task/service";
import * as calendarService from "../calendar/service";

/**
 * Assistant tool handlers (Sprint 5.3, 06_AI_Architecture §5). Binds the assistant's tools to the
 * deterministic services — the ONLY way the assistant obtains facts. Each tool reads a public read
 * model and returns grounded data with entity refs for citations. No business logic here; the tools
 * delegate to the owning modules. Every answer the assistant gives is built from these results.
 */
export function buildToolRegistry(db: Database, tz: string, name: string): ToolRegistry {
  const reg = new ToolRegistry();

  const chiefNow: ToolPlugin = {
    definition: {
      name: "chief_now",
      description: "The current grounded recommendation from the Chief.",
      permissions: ["read:chief"],
      inputSchema: {},
    },
    async execute() {
      const ctx = await composeChiefContext(db, tz, name).catch(() => null);
      if (!ctx) return { unwired: true };
      return { recommendation: nowRecommendation(ctx) };
    },
  };

  const queryTasks: ToolPlugin = {
    definition: {
      name: "query_tasks",
      description: "Query tasks by status/text.",
      permissions: ["read:tasks"],
      inputSchema: {
        type: "object",
        properties: { text: { type: "string" }, limit: { type: "integer" } },
        required: [],
      },
    },
    async execute(input) {
      const tasks = input.text
        ? await taskService.search(db, String(input.text)).catch(() => [])
        : await taskService.list(db, {}).catch(() => []);
      return tasks
        .slice(0, Number(input.limit ?? 10))
        .map((t) => ({ id: t.id, title: t.title, status: t.status, dueAt: t.dueAt }));
    },
  };

  const queryCalendar: ToolPlugin = {
    definition: {
      name: "query_calendar",
      description: "Query calendar events in a date range.",
      permissions: ["read:calendar"],
      inputSchema: {
        type: "object",
        properties: { from: { type: "string" }, to: { type: "string" } },
        required: [],
      },
    },
    async execute(input) {
      const from = String(input.from ?? new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");
      const to = String(input.to ?? new Date().toISOString().slice(0, 10) + "T23:59:59.999Z");
      const events = await calendarService.list(db, { from, to }).catch(() => []);
      return events.map((e) => ({ id: e.id, title: e.title, start: e.startAt, end: e.endAt }));
    },
  };

  const searchSemantic: ToolPlugin = {
    definition: {
      name: "search_semantic",
      description: "Search the user's data (tasks) for a query.",
      permissions: ["read:search"],
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" }, limit: { type: "integer" } },
        required: ["query"],
      },
    },
    async execute(input) {
      const results = await taskService.search(db, String(input.query)).catch(() => []);
      return results
        .slice(0, Number(input.limit ?? 5))
        .map((t) => ({ id: t.id, title: t.title, status: t.status }));
    },
  };

  // chief_optimize is referenced by planning mode; a read-only stub that flags a proposal is needed.
  const chiefOptimize: ToolPlugin = {
    definition: {
      name: "chief_optimize",
      description: "Signal that a planner optimization proposal is available.",
      permissions: ["read:chief"],
      inputSchema: {},
    },
    async execute() {
      return { proposalAvailable: true };
    },
  };

  for (const t of [chiefNow, queryTasks, queryCalendar, searchSemantic, chiefOptimize])
    reg.register(t);
  return reg;
}

/** The read permissions the assistant is granted (read-only — mutations are proposals). */
export const ASSISTANT_GRANTS = ["read:chief", "read:tasks", "read:calendar", "read:search"];
