/**
 * Tool input validation (Sprint 5.1, 06_AI_Architecture §Tool Registry). A small, deterministic
 * JSON-schema-ish validator: checks required keys and top-level property types before a tool runs.
 * No tool executes on unvalidated input. Pure.
 */
import type { ToolDefinition } from "../schemas";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/** Validate `input` against a tool's `inputSchema` (supports `required` + top-level `properties`). */
export function validateToolInput(tool: ToolDefinition, input: unknown): ValidationResult {
  const errors: string[] = [];
  const schema = tool.inputSchema as {
    required?: string[];
    properties?: Record<string, { type?: string }>;
  };
  if (input === null || typeof input !== "object") {
    return { ok: false, errors: ["input must be an object"] };
  }
  const obj = input as Record<string, unknown>;
  for (const key of schema.required ?? []) {
    if (!(key in obj)) errors.push(`missing required field: ${key}`);
  }
  for (const [key, prop] of Object.entries(schema.properties ?? {})) {
    if (key in obj && prop.type && !matchesType(obj[key], prop.type)) {
      errors.push(`field ${key} must be ${prop.type}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

function matchesType(value: unknown, type: string): boolean {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
    case "integer":
      return typeof value === "number";
    case "boolean":
      return typeof value === "boolean";
    case "array":
      return Array.isArray(value);
    case "object":
      return value !== null && typeof value === "object" && !Array.isArray(value);
    default:
      return true;
  }
}
