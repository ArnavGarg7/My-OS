/**
 * Unified client persistence (Sprint 1.4, Part 9). The ONLY module that touches
 * localStorage directly. Everything else goes through `appStorage` or the
 * `usePersistentState` / `useLocalStorage` hooks. SSR-safe, JSON-serialized,
 * and cross-tab reactive (via the `storage` event + a same-tab notifier).
 */

/** Canonical, namespaced storage keys. */
export const STORAGE_KEYS = {
  theme: "myos-theme", // owned by @myos/ui ThemeProvider
  sidebar: "myos-sidebar", // owned by the shell store (zustand persist)
  lastRoute: "myos-last-path",
  recentPages: "myos-recent-pages",
  panelWidths: "myos-panel-widths",
  inspector: "myos-inspector",
  windowPrefs: "myos-window-prefs",
  preferences: "myos-preferences",
  commandHistory: "myos-command-history",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS] | (string & {});

type Listener = (value: unknown) => void;

const listeners = new Map<string, Set<Listener>>();
let storageEventBound = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function notify(key: string, value: unknown): void {
  listeners.get(key)?.forEach((listener) => listener(value));
}

function ensureStorageEvent(): void {
  if (storageEventBound || !isBrowser()) return;
  storageEventBound = true;
  window.addEventListener("storage", (event) => {
    if (event.key === null) {
      // storage cleared
      listeners.forEach((set, key) => set.forEach((l) => l(readRaw(key, undefined))));
      return;
    }
    if (!listeners.has(event.key)) return;
    const value =
      event.newValue === null ? undefined : safeParse<unknown>(event.newValue, undefined);
    notify(event.key, value);
  });
}

function safeParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readRaw<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  const raw = window.localStorage.getItem(key);
  return raw === null ? fallback : safeParse(raw, fallback);
}

export const appStorage = {
  /** Read a value, returning `fallback` when absent / on the server. */
  get<T>(key: StorageKey, fallback: T): T {
    return readRaw(key, fallback);
  },

  /** Write a value and notify subscribers (same tab + cross tab). */
  set<T>(key: StorageKey, value: T): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      notify(key, value);
    } catch {
      // quota / disabled storage — fail silently
    }
  },

  /** Remove a value and notify subscribers. */
  remove(key: StorageKey): void {
    if (!isBrowser()) return;
    try {
      window.localStorage.removeItem(key);
      notify(key, undefined);
    } catch {
      // ignore
    }
  },

  /** Subscribe to changes for a key. Returns an unsubscribe function. */
  subscribe(key: StorageKey, listener: Listener): () => void {
    ensureStorageEvent();
    const set = listeners.get(key) ?? new Set<Listener>();
    set.add(listener);
    listeners.set(key, set);
    return () => {
      set.delete(listener);
      if (set.size === 0) listeners.delete(key);
    };
  },
};
