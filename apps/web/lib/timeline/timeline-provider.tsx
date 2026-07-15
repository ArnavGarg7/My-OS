"use client";

import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useEffect } from "react";
import { TimelineEmitter } from "./emitter";
import type { TimelineEvent, TimelineInput } from "./types";

/**
 * TimelineProvider (Sprint 2.8.5). Holds one process-wide `TimelineEmitter` and
 * exposes it via `useTimeline()`. Engines call `emit(...)` from their mutation
 * success handlers; the Sprint 2.13 Timeline page will subscribe to render them.
 */
export interface TimelineValue {
  emit: (input: TimelineInput) => TimelineEvent;
  recent: TimelineEvent[];
  subscribe: (fn: (event: TimelineEvent) => void) => () => void;
}

const TimelineContext = createContext<TimelineValue | null>(null);

export function TimelineProvider({ children }: { children: ReactNode }) {
  const emitterRef = useRef<TimelineEmitter | null>(null);
  if (!emitterRef.current) emitterRef.current = new TimelineEmitter();
  const emitter = emitterRef.current;

  const [recent, setRecent] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    return emitter.subscribe(() => setRecent(emitter.recent()));
  }, [emitter]);

  const value = useMemo<TimelineValue>(
    () => ({
      emit: (input) => emitter.emit(input),
      recent,
      subscribe: (fn) => emitter.subscribe(fn),
    }),
    [emitter, recent],
  );

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>;
}

export function useTimeline(): TimelineValue {
  const ctx = useContext(TimelineContext);
  if (!ctx) throw new Error("useTimeline must be used within <TimelineProvider>");
  return ctx;
}

/**
 * Safe variant for engine hooks that may render outside the provider in tests —
 * returns a no-op emitter rather than throwing.
 */
export function useOptionalTimeline(): Pick<TimelineValue, "emit"> {
  const ctx = useContext(TimelineContext);
  return (
    ctx ?? { emit: () => ({ id: "", kind: "task.completed", source: "task", title: "", at: "" }) }
  );
}
