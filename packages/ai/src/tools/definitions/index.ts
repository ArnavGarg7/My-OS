/**
 * Built-in tool definitions (Sprint 5.1, 06_AI_Architecture §5). Read-only tools the Assistant will
 * use in a later sprint. Here they ship as registry plugins with real definitions + permission tags;
 * their `execute` delegates to a server-injected handler (5.1 has no data access, so unwired
 * handlers return a deterministic "not wired" marker). Pure definitions.
 */
import type { ToolPlugin, ToolContext } from "../registry";

/** A handler map the server injects via ToolContext.services.handlers. */
type Handlers = Record<
  string,
  (input: Record<string, unknown>, ctx: ToolContext) => Promise<unknown> | unknown
>;

function readTool(
  name: string,
  description: string,
  inputSchema: Record<string, unknown>,
  permissions: string[],
): ToolPlugin {
  return {
    definition: { name, description, permissions, inputSchema },
    execute(input, ctx) {
      const handlers = (ctx.services?.handlers as Handlers | undefined) ?? {};
      const handler = handlers[name];
      if (!handler)
        return { unwired: true, tool: name, note: "no handler injected (5.1 foundation)" };
      return handler(input, ctx);
    },
  };
}

/** The read-only tool set (06_AI_Architecture §5). Propose/meta tools land with the Assistant sprint. */
export const BUILTIN_TOOLS: ToolPlugin[] = [
  readTool(
    "query_tasks",
    "Query tasks by status, area, project, due date, or text.",
    {
      type: "object",
      properties: {
        status: { type: "string" },
        area: { type: "string" },
        project: { type: "string" },
        overdue: { type: "boolean" },
        text: { type: "string" },
        limit: { type: "integer" },
      },
      required: [],
    },
    ["read:tasks"],
  ),
  readTool(
    "query_calendar",
    "Query calendar events in a date range.",
    {
      type: "object",
      properties: { from: { type: "string" }, to: { type: "string" } },
      required: ["from", "to"],
    },
    ["read:calendar"],
  ),
  readTool(
    "search_semantic",
    "Semantic search across the user's data.",
    {
      type: "object",
      properties: { query: { type: "string" }, limit: { type: "integer" } },
      required: ["query"],
    },
    ["read:search"],
  ),
];
