"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { CommandExecutor } from "./executor";
import { CommandHistory, type CommandHistoryState } from "./history";
import { CommandRegistry } from "./registry";
import type { Command, CommandGroup, CommandGroupInfo } from "./types";

/**
 * CommandCenterProvider (Sprint 1.6). Owns the registry, history and executor
 * for the app and exposes them through hooks. This is the one place feature
 * modules reach for to register commands — a core architectural pillar alongside
 * the Shell, Framework, Identity and Design System.
 */
interface CommandCenterValue {
  registry: CommandRegistry;
  history: CommandHistory;
  executor: CommandExecutor;
}

const CommandCenterContext = createContext<CommandCenterValue | null>(null);

export function CommandCenterProvider({ children }: { children: ReactNode }) {
  const [value] = useState<CommandCenterValue>(() => {
    const registry = new CommandRegistry();
    const history = new CommandHistory();
    const executor = new CommandExecutor(registry, history);
    return { registry, history, executor };
  });

  return <CommandCenterContext.Provider value={value}>{children}</CommandCenterContext.Provider>;
}

function useCommandCenterContext(): CommandCenterValue {
  const ctx = useContext(CommandCenterContext);
  if (!ctx) {
    throw new Error("Command Center hooks must be used within <CommandCenterProvider>");
  }
  return ctx;
}

export function useCommandRegistry(): CommandRegistry {
  return useCommandCenterContext().registry;
}

export function useCommandExecutor(): CommandExecutor {
  return useCommandCenterContext().executor;
}

/** Reactive snapshot of every registered command (sorted). */
export function useCommands(): Command[] {
  const { registry } = useCommandCenterContext();
  return useSyncExternalStore(
    registry.subscribe,
    registry.getListSnapshot,
    registry.getListSnapshot,
  );
}

/** Reactive snapshot of registered groups. */
export function useCommandGroups(): CommandGroupInfo[] {
  const { registry } = useCommandCenterContext();
  return useSyncExternalStore(
    registry.subscribe,
    registry.getGroupsSnapshot,
    registry.getGroupsSnapshot,
  );
}

/** Reactive command history + the history instance for mutations. */
export function useCommandHistory(): { state: CommandHistoryState; history: CommandHistory } {
  const { history } = useCommandCenterContext();
  const state = useSyncExternalStore(history.subscribe, history.getSnapshot, history.getSnapshot);
  return { state, history };
}

/** Register a group of commands for the lifetime of a component. */
export function useRegisterGroup(group: CommandGroup): void {
  const { registry } = useCommandCenterContext();
  useEffect(() => registry.registerGroup(group), [registry, group]);
}

/** Register several groups for the lifetime of a component. `groups` must be stable. */
export function useRegisterGroups(groups: CommandGroup[]): void {
  const { registry } = useCommandCenterContext();
  useEffect(() => {
    const unregister = groups.map((group) => registry.registerGroup(group));
    return () => unregister.forEach((fn) => fn());
  }, [registry, groups]);
}

/** Register loose commands (optionally into a group). `commands` must be stable. */
export function useRegisterCommands(commands: Command[], groupId?: string): void {
  const { registry } = useCommandCenterContext();
  useEffect(() => {
    const unregister = commands.map((command) => registry.register(command, groupId));
    return () => unregister.forEach((fn) => fn());
  }, [registry, commands, groupId]);
}
