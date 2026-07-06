"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { matchesCombo, parseCombo, type ParsedCombo } from "../hooks/use-hotkeys";

export interface ShortcutOptions {
  description?: string;
  enableOnFormTags?: boolean;
  preventDefault?: boolean;
}

export interface ShortcutInfo {
  combo: string;
  description: string | undefined;
}

interface Registered {
  id: string;
  combo: string;
  parsed: ParsedCombo;
  handler: (event: KeyboardEvent) => void;
  options: ShortcutOptions;
}

interface ShortcutContextValue {
  register: (
    combo: string,
    handler: (event: KeyboardEvent) => void,
    options?: ShortcutOptions,
  ) => () => void;
  shortcuts: ShortcutInfo[];
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

let shortcutCounter = 0;

function isFormElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/**
 * ShortcutProvider — the Shortcut Manager. A single global listener dispatches
 * to registered handlers; `useRegisterShortcut` (or `register`) adds them. The
 * `shortcuts` list can drive a future keyboard-help overlay.
 */
export function ShortcutProvider({ children }: { children: ReactNode }) {
  const registry = useRef(new Map<string, Registered>());
  const [shortcuts, setShortcuts] = useState<ShortcutInfo[]>([]);

  const syncList = useCallback(() => {
    setShortcuts(
      [...registry.current.values()].map((entry) => ({
        combo: entry.combo,
        description: entry.options.description,
      })),
    );
  }, []);

  const register = useCallback(
    (combo: string, handler: (event: KeyboardEvent) => void, options: ShortcutOptions = {}) => {
      const id = `sc-${++shortcutCounter}`;
      registry.current.set(id, { id, combo, parsed: parseCombo(combo), handler, options });
      syncList();
      return () => {
        registry.current.delete(id);
        syncList();
      };
    },
    [syncList],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const inForm = isFormElement(event.target);
      for (const entry of registry.current.values()) {
        if (!matchesCombo(entry.parsed, event)) continue;
        if (inForm && !entry.options.enableOnFormTags && !entry.parsed.hasModifier) continue;
        if (entry.options.preventDefault !== false) event.preventDefault();
        entry.handler(event);
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo<ShortcutContextValue>(
    () => ({ register, shortcuts }),
    [register, shortcuts],
  );

  return <ShortcutContext.Provider value={value}>{children}</ShortcutContext.Provider>;
}

export function useShortcutManager(): ShortcutContextValue {
  const ctx = useContext(ShortcutContext);
  if (!ctx) throw new Error("useShortcutManager must be used within <AppProvider>");
  return ctx;
}

/** Register a shortcut for the lifetime of a component. */
export function useRegisterShortcut(
  combo: string,
  handler: (event: KeyboardEvent) => void,
  options?: ShortcutOptions,
): void {
  const { register } = useShortcutManager();
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);
  useEffect(
    () => register(combo, (event) => handlerRef.current(event), options),
    // Re-register only when the combo or option identity changes.
    [register, combo, options],
  );
}
