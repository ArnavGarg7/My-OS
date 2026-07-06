import { appStorage, STORAGE_KEYS, type StorageKey } from "@/lib/framework/persistence";

/**
 * Command history (Sprint 1.6). Infrastructure only — tracks recent / frequent /
 * last-executed / pinned command ids, persisted through the framework
 * persistence layer (never localStorage directly). No UI analytics.
 */
export interface CommandHistoryState {
  /** Most-recent-first, de-duplicated, capped at RECENT_LIMIT. */
  recent: string[];
  /** id → execution count. */
  counts: Record<string, number>;
  lastExecutedId: string | null;
  pinned: string[];
}

const EMPTY_STATE: CommandHistoryState = {
  recent: [],
  counts: {},
  lastExecutedId: null,
  pinned: [],
};

const RECENT_LIMIT = 20;

export class CommandHistory {
  private state: CommandHistoryState;
  private listeners = new Set<() => void>();
  private readonly key: StorageKey;

  constructor(key: StorageKey = STORAGE_KEYS.commandHistory) {
    this.key = key;
    this.state = { ...EMPTY_STATE, ...appStorage.get<CommandHistoryState>(key, EMPTY_STATE) };
  }

  record(id: string): void {
    const recent = [id, ...this.state.recent.filter((existing) => existing !== id)].slice(
      0,
      RECENT_LIMIT,
    );
    const counts = { ...this.state.counts, [id]: (this.state.counts[id] ?? 0) + 1 };
    this.commit({ ...this.state, recent, counts, lastExecutedId: id });
  }

  getRecent(limit = 5): string[] {
    return this.state.recent.slice(0, limit);
  }

  getFrequent(limit = 5): string[] {
    return Object.entries(this.state.counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
  }

  getLastExecuted(): string | null {
    return this.state.lastExecutedId;
  }

  isPinned(id: string): boolean {
    return this.state.pinned.includes(id);
  }

  getPinned(): string[] {
    return this.state.pinned;
  }

  pin(id: string): void {
    if (!this.isPinned(id)) this.commit({ ...this.state, pinned: [...this.state.pinned, id] });
  }

  unpin(id: string): void {
    if (this.isPinned(id)) {
      this.commit({ ...this.state, pinned: this.state.pinned.filter((pin) => pin !== id) });
    }
  }

  togglePin(id: string): void {
    if (this.isPinned(id)) this.unpin(id);
    else this.pin(id);
  }

  clear(): void {
    this.commit({ ...EMPTY_STATE });
  }

  private commit(next: CommandHistoryState): void {
    this.state = next;
    appStorage.set(this.key, next);
    for (const listener of this.listeners) listener();
  }

  // --- external-store adapters ---
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getSnapshot = (): CommandHistoryState => this.state;
}
