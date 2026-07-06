import type { LucideIcon } from "lucide-react";

/**
 * Command Center type model (Sprint 1.6). The strongly-typed contract every
 * module uses to expose commands. No anonymous command objects anywhere — a
 * command is always a {@link Command}.
 */

/** Built-in categories; modules may introduce their own string categories. */
export type CommandCategory =
  "navigation" | "appearance" | "system" | "account" | "developer" | (string & {});

/** Where an execution was invoked from. */
export type CommandSource = "palette" | "shortcut" | "programmatic";

/** Passed to `Command.execute`. Carries invocation context + a `close()` hook. */
export interface CommandExecutionContext {
  source: CommandSource;
  invokedAt: number;
  query: string;
  /** Close the command palette (no-op for programmatic/shortcut sources). */
  close: () => void;
}

export type CommandResultStatus = "success" | "error" | "noop";

/** Normalized outcome of an execution. */
export interface CommandResult {
  status: CommandResultStatus;
  commandId: string;
  message?: string;
  error?: unknown;
}

/** What a `Command.execute` may return (normalized into a {@link CommandResult}). */
export type CommandExecuteReturn =
  void | boolean | { status?: CommandResultStatus; message?: string; error?: unknown };

/** Free-form, typed metadata that doesn't affect execution. */
export interface CommandMetadata {
  destructive?: boolean;
  experimental?: boolean;
  [key: string]: unknown;
}

/** The command model (Sprint 1.6). */
export interface Command {
  id: string;
  title: string;
  subtitle?: string;
  category: CommandCategory;
  keywords?: string[];
  icon?: LucideIcon;
  /** Display-only shortcut hint, e.g. "⌘B". Global binding is out of scope. */
  shortcut?: string;
  /** Higher sorts earlier within a group. Defaults to 0. */
  priority?: number;
  /** Whether the command can currently run. Defaults to true. */
  enabled?: () => boolean;
  /** Whether the command should appear at all. Defaults to true. */
  visible?: () => boolean;
  execute: (
    context: CommandExecutionContext,
  ) => CommandExecuteReturn | Promise<CommandExecuteReturn>;
  meta?: CommandMetadata;
}

/** A named collection of commands, registered as a unit. */
export interface CommandGroup {
  id: string;
  title: string;
  category: CommandCategory;
  /** Higher sorts earlier among groups. Defaults to 0. */
  priority?: number;
  commands: Command[];
}

/** Registry-internal record for a command. */
export interface RegisteredCommand {
  command: Command;
  groupId: string;
  /** Imperative registry-level disable (overrides `command.enabled`). */
  disabled: boolean;
}

/** Lightweight group descriptor exposed by the registry. */
export interface CommandGroupInfo {
  id: string;
  title: string;
  category: CommandCategory;
  priority: number;
}

export const DEFAULT_COMMAND_PRIORITY = 0;
export const DEFAULT_GROUP_PRIORITY = 0;
