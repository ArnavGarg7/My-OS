/**
 * Command Center (Sprint 1.6) — the OS command interface. Feature modules import
 * from here to register commands; nothing imports the internals directly.
 */
export type {
  Command,
  CommandCategory,
  CommandGroup,
  CommandGroupInfo,
  CommandExecutionContext,
  CommandExecuteReturn,
  CommandResult,
  CommandResultStatus,
  CommandSource,
  CommandMetadata,
} from "./types";
export { CommandRegistry } from "./registry";
export { CommandHistory, type CommandHistoryState } from "./history";
export { CommandExecutor, type ExecuteOptions } from "./executor";
export { validateCommand, assertValidCommand, CommandValidationError } from "./validation";
export {
  filterCommands,
  matchesQuery,
  highlightMatch,
  normalizeQuery,
  type HighlightSegment,
} from "./matching";
export {
  CommandCenterProvider,
  useCommandRegistry,
  useCommandExecutor,
  useCommands,
  useCommandGroups,
  useCommandHistory,
  useRegisterGroup,
  useRegisterGroups,
  useRegisterCommands,
} from "./provider";
export {
  useCommandPalette,
  type CommandPalette,
  type PaletteItem,
  type PaletteSection,
} from "./use-command-palette";
