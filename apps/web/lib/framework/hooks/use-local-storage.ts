"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { appStorage, type StorageKey } from "../persistence";

export type SetValue<T> = (value: T | ((prev: T) => T)) => void;

/**
 * Reactive localStorage binding (SSR-safe, cross-tab). Returns
 * `[value, setValue, remove]`. First render returns `initial` (matching the
 * server) and hydrates from storage on mount to avoid a hydration mismatch.
 */
export function useLocalStorage<T>(key: StorageKey, initial: T): [T, SetValue<T>, () => void] {
  const initialRef = useRef(initial);
  const [value, setInternal] = useState<T>(initialRef.current);

  useEffect(() => {
    setInternal(appStorage.get(key, initialRef.current));
    return appStorage.subscribe(key, (next) => {
      setInternal(next === undefined ? initialRef.current : (next as T));
    });
  }, [key]);

  const setValue = useCallback<SetValue<T>>(
    (next) => {
      setInternal((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        appStorage.set(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  const remove = useCallback(() => {
    appStorage.remove(key);
    setInternal(initialRef.current);
  }, [key]);

  return [value, setValue, remove];
}
