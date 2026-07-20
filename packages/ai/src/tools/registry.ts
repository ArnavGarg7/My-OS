/**
 * Tool Registry (Sprint 5.1, 06_AI_Architecture §Tool Registry). Every tool is a plugin exporting
 * a definition (name/description/schema/permissions) plus an `execute` function. Tools are never
 * invoked directly — the executor routes through the registry, permission check and validation.
 * Pure container.
 */
import { toolDefinitionSchema, type ToolDefinition } from "../schemas";

/** Execution context handed to a tool (injected data access lives in server-supplied handlers). */
export interface ToolContext {
  userId?: string;
  now: Date;
  /** Arbitrary injected services (e.g. read-model accessors) supplied by the server. */
  services?: Record<string, unknown>;
}

export interface ToolPlugin {
  definition: ToolDefinition;
  execute(input: Record<string, unknown>, ctx: ToolContext): Promise<unknown> | unknown;
}

export class ToolRegistry {
  private readonly tools = new Map<string, ToolPlugin>();

  register(plugin: ToolPlugin): this {
    const def = toolDefinitionSchema.parse(plugin.definition);
    this.tools.set(def.name, { ...plugin, definition: def });
    return this;
  }

  get(name: string): ToolPlugin | null {
    return this.tools.get(name) ?? null;
  }

  list(): ToolDefinition[] {
    return [...this.tools.values()]
      .map((t) => t.definition)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }
}
