"use client";

import { useLocalStorage, type SetValue } from "./use-local-storage";
import type { StorageKey } from "../persistence";

/**
 * Persisted state — the ergonomic default for "remember this across sessions".
 * A thin `[value, setValue]` view over {@link useLocalStorage}.
 */
export function usePersistentState<T>(key: StorageKey, initial: T): [T, SetValue<T>] {
  const [value, setValue] = useLocalStorage<T>(key, initial);
  return [value, setValue];
}
