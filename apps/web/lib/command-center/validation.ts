import type { Command } from "./types";

/**
 * Command validation (Sprint 1.6). A cheap structural guard run at registration
 * so a malformed command fails loudly at its source rather than silently in the
 * palette.
 */
export class CommandValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommandValidationError";
  }
}

/** Returns a list of problems with a command (empty = valid). */
export function validateCommand(command: Command): string[] {
  const errors: string[] = [];
  if (!command || typeof command !== "object") return ["command must be an object"];
  if (!command.id) errors.push("id is required");
  if (!command.title) errors.push("title is required");
  if (!command.category) errors.push("category is required");
  if (typeof command.execute !== "function") errors.push("execute must be a function");
  if (command.enabled !== undefined && typeof command.enabled !== "function")
    errors.push("enabled must be a function");
  if (command.visible !== undefined && typeof command.visible !== "function")
    errors.push("visible must be a function");
  return errors;
}

export function assertValidCommand(command: Command): void {
  const errors = validateCommand(command);
  if (errors.length > 0) {
    throw new CommandValidationError(
      `Invalid command "${command?.id ?? "?"}": ${errors.join(", ")}`,
    );
  }
}
