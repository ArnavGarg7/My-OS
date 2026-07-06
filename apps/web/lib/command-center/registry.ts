import {
  DEFAULT_GROUP_PRIORITY,
  type Command,
  type CommandCategory,
  type CommandGroup,
  type CommandGroupInfo,
  type RegisteredCommand,
} from "./types";
import { assertValidCommand } from "./validation";

const UNGROUPED = "ungrouped";

function safeBool(fn: (() => boolean) | undefined, fallback: boolean): boolean {
  if (!fn) return fallback;
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/**
 * CommandRegistry (Sprint 1.6). The observable store of commands + groups. It is
 * framework-agnostic; the React provider adapts it via `useSyncExternalStore`.
 * Snapshots are cached and invalidated on mutation so hook subscribers get a
 * stable reference between changes. Future modules register without editing it.
 */
export class CommandRegistry {
  private commands = new Map<string, RegisteredCommand>();
  private groups = new Map<string, CommandGroupInfo>();
  private listeners = new Set<() => void>();
  private listSnapshot: Command[] | null = null;
  private groupsSnapshot: CommandGroupInfo[] | null = null;

  register(command: Command, groupId: string = UNGROUPED): () => void {
    assertValidCommand(command);
    this.commands.set(command.id, { command, groupId, disabled: false });
    if (!this.groups.has(groupId)) {
      this.groups.set(groupId, {
        id: groupId,
        title: groupId,
        category: command.category,
        priority: DEFAULT_GROUP_PRIORITY,
      });
    }
    this.invalidate();
    return () => this.unregister(command.id);
  }

  unregister(id: string): void {
    if (this.commands.delete(id)) this.invalidate();
  }

  registerGroup(group: CommandGroup): () => void {
    this.groups.set(group.id, {
      id: group.id,
      title: group.title,
      category: group.category,
      priority: group.priority ?? DEFAULT_GROUP_PRIORITY,
    });
    for (const command of group.commands) {
      assertValidCommand(command);
      this.commands.set(command.id, { command, groupId: group.id, disabled: false });
    }
    this.invalidate();
    return () => this.removeGroup(group.id);
  }

  removeGroup(groupId: string): void {
    let changed = this.groups.delete(groupId);
    for (const [id, record] of this.commands) {
      if (record.groupId === groupId) {
        this.commands.delete(id);
        changed = true;
      }
    }
    if (changed) this.invalidate();
  }

  enable(id: string): void {
    this.setDisabled(id, false);
  }

  disable(id: string): void {
    this.setDisabled(id, true);
  }

  private setDisabled(id: string, disabled: boolean): void {
    const record = this.commands.get(id);
    if (record && record.disabled !== disabled) {
      record.disabled = disabled;
      this.invalidate();
    }
  }

  /** Replace an existing command in place (keeps its group + disabled flag). */
  replace(command: Command): void {
    assertValidCommand(command);
    const existing = this.commands.get(command.id);
    this.commands.set(command.id, {
      command,
      groupId: existing?.groupId ?? UNGROUPED,
      disabled: existing?.disabled ?? false,
    });
    this.invalidate();
  }

  find(id: string): Command | undefined {
    return this.commands.get(id)?.command;
  }

  has(id: string): boolean {
    return this.commands.has(id);
  }

  groupOf(id: string): string | undefined {
    return this.commands.get(id)?.groupId;
  }

  /** Registry-level disable OR `command.enabled() === false` → not enabled. */
  isEnabled(id: string): boolean {
    const record = this.commands.get(id);
    if (!record) return false;
    if (record.disabled) return false;
    return safeBool(record.command.enabled, true);
  }

  isVisible(id: string): boolean {
    const record = this.commands.get(id);
    if (!record) return false;
    return safeBool(record.command.visible, true);
  }

  /** All commands, sorted by group priority, then command priority, then title. */
  list(): Command[] {
    if (this.listSnapshot) return this.listSnapshot;
    const records = [...this.commands.values()];
    records.sort((a, b) => {
      const ga = this.groups.get(a.groupId)?.priority ?? 0;
      const gb = this.groups.get(b.groupId)?.priority ?? 0;
      if (ga !== gb) return gb - ga;
      const pa = a.command.priority ?? 0;
      const pb = b.command.priority ?? 0;
      if (pa !== pb) return pb - pa;
      return a.command.title.localeCompare(b.command.title);
    });
    this.listSnapshot = records.map((record) => record.command);
    return this.listSnapshot;
  }

  getByCategory(category: CommandCategory): Command[] {
    return this.list().filter((command) => command.category === category);
  }

  getGroups(): CommandGroupInfo[] {
    if (this.groupsSnapshot) return this.groupsSnapshot;
    this.groupsSnapshot = [...this.groups.values()].sort(
      (a, b) => b.priority - a.priority || a.title.localeCompare(b.title),
    );
    return this.groupsSnapshot;
  }

  clear(): void {
    if (this.commands.size === 0 && this.groups.size === 0) return;
    this.commands.clear();
    this.groups.clear();
    this.invalidate();
  }

  // --- external-store adapters (stable identities) ---
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getListSnapshot = (): Command[] => this.list();
  getGroupsSnapshot = (): CommandGroupInfo[] => this.getGroups();

  private invalidate(): void {
    this.listSnapshot = null;
    this.groupsSnapshot = null;
    for (const listener of this.listeners) listener();
  }
}
