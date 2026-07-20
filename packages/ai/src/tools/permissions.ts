/**
 * Tool permissions (Sprint 5.1, 06_AI_Architecture §Tool Registry). Every tool declares required
 * permissions; the executor checks them against a granted set before running. Pure.
 */
import type { ToolDefinition } from "../schemas";

export interface PermissionResult {
  allowed: boolean;
  missing: string[];
}

/** Check a tool's required permissions against the granted set. */
export function checkPermissions(
  tool: ToolDefinition,
  granted: readonly string[],
): PermissionResult {
  const grantedSet = new Set(granted);
  const missing = tool.permissions.filter((p) => !grantedSet.has(p));
  return { allowed: missing.length === 0, missing };
}
