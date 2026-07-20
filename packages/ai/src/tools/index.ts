/**
 * @myos/ai/tools — the tool platform (06_AI_Architecture §Tool Registry). Plugins, permission
 * gating, input validation, and the one execution pipeline. No tool runs any other way.
 */
export { ToolRegistry, type ToolPlugin, type ToolContext } from "./registry";
export { checkPermissions, type PermissionResult } from "./permissions";
export { validateToolInput, type ValidationResult } from "./validation";
export { executeTool, type ToolExecutionResult, type ExecuteOptions } from "./executor";
export { BUILTIN_TOOLS } from "./definitions";
