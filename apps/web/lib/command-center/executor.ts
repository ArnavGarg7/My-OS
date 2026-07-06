import type { CommandHistory } from "./history";
import type { CommandRegistry } from "./registry";
import type {
  CommandExecuteReturn,
  CommandExecutionContext,
  CommandResult,
  CommandSource,
} from "./types";

/**
 * CommandExecutor (Sprint 1.6). The single execution engine — nothing runs a
 * command directly from the UI. It validates availability, builds the execution
 * context, records history on success, normalizes the result, and never throws.
 */
export interface ExecuteOptions {
  source?: CommandSource;
  query?: string;
  close?: () => void;
}

function normalizeResult(id: string, raw: CommandExecuteReturn): CommandResult {
  if (raw === false) return { status: "noop", commandId: id };
  if (raw && typeof raw === "object") {
    return {
      status: raw.status ?? "success",
      commandId: id,
      ...(raw.message === undefined ? {} : { message: raw.message }),
      ...(raw.error === undefined ? {} : { error: raw.error }),
    };
  }
  return { status: "success", commandId: id };
}

export class CommandExecutor {
  constructor(
    private readonly registry: CommandRegistry,
    private readonly history: CommandHistory,
    private readonly onResult?: (result: CommandResult) => void,
  ) {}

  async execute(id: string, options: ExecuteOptions = {}): Promise<CommandResult> {
    const command = this.registry.find(id);
    if (!command) {
      return this.finish({ status: "error", commandId: id, message: "Command not found" });
    }
    if (!this.registry.isVisible(id) || !this.registry.isEnabled(id)) {
      return this.finish({ status: "noop", commandId: id, message: "Command is not available" });
    }

    const context: CommandExecutionContext = {
      source: options.source ?? "programmatic",
      invokedAt: Date.now(),
      query: options.query ?? "",
      close: options.close ?? (() => {}),
    };

    try {
      const raw = await command.execute(context);
      this.history.record(id);
      return this.finish(normalizeResult(id, raw));
    } catch (error) {
      return this.finish({ status: "error", commandId: id, message: "Command threw", error });
    }
  }

  private finish(result: CommandResult): CommandResult {
    this.onResult?.(result);
    return result;
  }
}
