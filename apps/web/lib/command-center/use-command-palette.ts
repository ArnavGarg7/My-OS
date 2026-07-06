"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useCommandCenter } from "@/lib/framework/hooks/use-command-center";
import { filterCommands } from "./matching";
import { useCommandExecutor, useCommandHistory, useCommandRegistry, useCommands } from "./provider";
import type { Command } from "./types";

/**
 * Command Palette controller (Sprint 1.6). Turns the registry + query + history
 * into rendered sections, owns keyboard navigation, and routes execution through
 * the executor. The palette UI is a thin renderer over this.
 */
export interface PaletteItem {
  key: string;
  command: Command;
  enabled: boolean;
}

export interface PaletteSection {
  id: string;
  title: string;
  items: PaletteItem[];
}

export interface CommandPalette {
  open: boolean;
  setOpen: (open: boolean) => void;
  query: string;
  setQuery: (query: string) => void;
  sections: PaletteSection[];
  activeKey: string | null;
  setActiveKey: (key: string) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  run: (key: string) => void;
  totalCount: number;
  isEmpty: boolean;
  isReady: boolean;
}

const RECENT_LIMIT = 5;
const PAGE_SIZE = 8;

export function useCommandPalette(): CommandPalette {
  const { open, setOpen } = useCommandCenter();
  const registry = useCommandRegistry();
  const executor = useCommandExecutor();
  const commands = useCommands();
  const { state: history } = useCommandHistory();

  const [query, setQuery] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Reset the query each time the palette opens.
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const { sections, keyToId, navigableKeys } = useMemo(() => {
    const visible = commands.filter((command) => registry.isVisible(command.id));
    const filtered = filterCommands(visible, query);
    const byId = new Map(filtered.map((command) => [command.id, command]));

    const recentIds =
      query.trim().length === 0
        ? history.recent.filter((id) => byId.has(id)).slice(0, RECENT_LIMIT)
        : [];
    const recentSet = new Set(recentIds);

    const built: PaletteSection[] = [];
    if (recentIds.length > 0) {
      built.push({
        id: "recent",
        title: "Recently used",
        items: recentIds.map((id) => ({
          key: `recent:${id}`,
          command: byId.get(id)!,
          enabled: registry.isEnabled(id),
        })),
      });
    }

    for (const group of registry.getGroups()) {
      const items = filtered
        .filter(
          (command) => registry.groupOf(command.id) === group.id && !recentSet.has(command.id),
        )
        .map((command) => ({
          key: `${group.id}:${command.id}`,
          command,
          enabled: registry.isEnabled(command.id),
        }));
      if (items.length > 0) built.push({ id: group.id, title: group.title, items });
    }

    const entries = built.flatMap((section) => section.items);
    return {
      sections: built,
      keyToId: new Map(entries.map((entry) => [entry.key, entry.command.id])),
      navigableKeys: entries.filter((entry) => entry.enabled).map((entry) => entry.key),
    };
  }, [commands, query, history, registry]);

  // Keep the active key valid as the list changes.
  const navKeysSignature = navigableKeys.join("|");
  useEffect(() => {
    if (navigableKeys.length === 0) {
      setActiveKey(null);
    } else if (!activeKey || !navigableKeys.includes(activeKey)) {
      setActiveKey(navigableKeys[0] ?? null);
    }
    // navKeysSignature captures list identity without depending on the array ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navKeysSignature]);

  const moveBy = useCallback(
    (delta: number) => {
      if (navigableKeys.length === 0) return;
      const current = activeKey ? navigableKeys.indexOf(activeKey) : -1;
      const next =
        current === -1
          ? delta > 0
            ? 0
            : navigableKeys.length - 1
          : (current + delta + navigableKeys.length) % navigableKeys.length;
      setActiveKey(navigableKeys[next] ?? null);
    },
    [navigableKeys, activeKey],
  );

  const moveTo = useCallback(
    (index: number) => {
      if (navigableKeys.length === 0) return;
      const clamped = Math.max(0, Math.min(navigableKeys.length - 1, index));
      setActiveKey(navigableKeys[clamped] ?? null);
    },
    [navigableKeys],
  );

  const run = useCallback(
    (key: string) => {
      const id = keyToId.get(key);
      if (!id) return;
      void executor.execute(id, {
        source: "palette",
        query,
        close: () => setOpen(false),
      });
    },
    [keyToId, executor, query, setOpen],
  );

  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          moveBy(1);
          break;
        case "ArrowUp":
          event.preventDefault();
          moveBy(-1);
          break;
        case "Tab":
          event.preventDefault();
          moveBy(event.shiftKey ? -1 : 1);
          break;
        case "Home":
          event.preventDefault();
          moveTo(0);
          break;
        case "End":
          event.preventDefault();
          moveTo(navigableKeys.length - 1);
          break;
        case "PageDown":
          event.preventDefault();
          moveTo(navigableKeys.indexOf(activeKeyRef.current ?? "") + PAGE_SIZE || PAGE_SIZE);
          break;
        case "PageUp":
          event.preventDefault();
          moveTo(navigableKeys.indexOf(activeKeyRef.current ?? "") - PAGE_SIZE);
          break;
        case "Enter":
          if (activeKeyRef.current) {
            event.preventDefault();
            run(activeKeyRef.current);
          }
          break;
        case "Escape":
          event.preventDefault();
          setOpen(false);
          break;
        default:
          break;
      }
    },
    [moveBy, moveTo, navigableKeys, run, setOpen],
  );

  return {
    open,
    setOpen,
    query,
    setQuery,
    sections,
    activeKey,
    setActiveKey,
    onKeyDown,
    run,
    totalCount: navigableKeys.length,
    isEmpty: sections.length === 0,
    isReady: mounted,
  };
}
