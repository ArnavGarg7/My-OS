"use client";

import { useEffect, useRef } from "react";

export type HotkeyHandler = (event: KeyboardEvent) => void;
export type HotkeyMap = Record<string, HotkeyHandler>;

export interface HotkeyOptions {
  enabled?: boolean;
  /** Fire even when focus is in an input/textarea/contenteditable. Default: only combos with a modifier fire there. */
  enableOnFormTags?: boolean;
  /** preventDefault on match. Default true. */
  preventDefault?: boolean;
  /** Target to listen on. Default `window`. */
  target?: Window | null;
}

function isMac(): boolean {
  return typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform);
}

function isFormElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable === true
  );
}

export interface ParsedCombo {
  key: string;
  meta: boolean;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  hasModifier: boolean;
}

export function parseCombo(combo: string): ParsedCombo {
  const parts = combo
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  const mods = new Set(parts.slice(0, -1));
  const rawKey = parts[parts.length - 1] ?? "";
  const key = rawKey === "esc" ? "escape" : rawKey;
  const mac = isMac();
  const meta = mods.has("meta") || mods.has("cmd") || (mods.has("mod") && mac);
  const ctrl = mods.has("ctrl") || mods.has("control") || (mods.has("mod") && !mac);
  const shift = mods.has("shift");
  const alt = mods.has("alt") || mods.has("option");
  return { key, meta, ctrl, shift, alt, hasModifier: meta || ctrl || alt };
}

export function matchesCombo(parsed: ParsedCombo, event: KeyboardEvent): boolean {
  if (parsed.meta !== event.metaKey) return false;
  if (parsed.ctrl !== event.ctrlKey) return false;
  if (parsed.alt !== event.altKey) return false;
  if (parsed.shift !== event.shiftKey) return false;
  return event.key.toLowerCase() === parsed.key;
}

/**
 * Declarative keyboard shortcuts (Sprint 1.4 — Shortcut Manager primitive).
 *   useHotkeys({ "mod+k": open, "escape": close })
 * Combos: `mod` (⌘ on mac, Ctrl elsewhere), `ctrl`, `meta`, `shift`, `alt`.
 */
export function useHotkeys(map: HotkeyMap, options: HotkeyOptions = {}): void {
  const { enabled = true, enableOnFormTags = false, preventDefault = true } = options;
  const mapRef = useRef(map);
  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  useEffect(() => {
    if (!enabled) return;
    const target: Window = options.target ?? window;
    const entries = Object.keys(mapRef.current).map((combo) => [parseCombo(combo), combo] as const);

    const onKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      const inForm = isFormElement(keyboardEvent.target);
      for (const [parsed, combo] of entries) {
        if (!matchesCombo(parsed, keyboardEvent)) continue;
        if (inForm && !enableOnFormTags && !parsed.hasModifier) continue;
        if (preventDefault) keyboardEvent.preventDefault();
        mapRef.current[combo]?.(keyboardEvent);
        return;
      }
    };

    target.addEventListener("keydown", onKeyDown);
    return () => target.removeEventListener("keydown", onKeyDown);
    // map is read via ref; re-bind only when config toggles change.
  }, [enabled, enableOnFormTags, preventDefault, options.target]);
}
