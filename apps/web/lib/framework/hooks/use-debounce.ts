"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Debounce a value — updates `delay` ms after it stops changing. */
export function useDebounce<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/** Debounce a callback. The returned function is stable and cancellable. */
export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delay = 250,
): ((...args: A) => void) & { cancel: () => void } {
  const callbackRef = useRef(callback);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  const debounced = useCallback(
    (...args: A) => {
      cancel();
      timerRef.current = window.setTimeout(() => callbackRef.current(...args), delay);
    },
    [cancel, delay],
  );

  return Object.assign(debounced, { cancel });
}
