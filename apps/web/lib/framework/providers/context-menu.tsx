"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@myos/ui";

export type ContextMenuItem =
  | {
      type: "item";
      label: string;
      icon?: LucideIcon;
      onSelect: () => void;
      danger?: boolean;
      disabled?: boolean;
      shortcut?: string;
    }
  | { type: "separator" }
  | { type: "label"; label: string };

interface MenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

interface ContextMenuContextValue {
  openMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
  closeMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

/**
 * ContextMenuProvider — the Context Menu Manager. Renders a floating menu at the
 * cursor, with keyboard nav, click-outside and Esc close. Attach via
 * `useContextMenu(items)` → an `onContextMenu` handler.
 */
export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MenuState | null>(null);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => setMounted(true), []);

  const openMenu = useCallback((x: number, y: number, items: ContextMenuItem[]) => {
    setActiveIndex(-1);
    setState({ x, y, items });
  }, []);
  const closeMenu = useCallback(() => setState(null), []);

  // Clamp the menu within the viewport after it renders.
  useLayoutEffect(() => {
    if (!state || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const left = Math.min(state.x, window.innerWidth - rect.width - 8);
    const top = Math.min(state.y, window.innerHeight - rect.height - 8);
    setPosition({ left: Math.max(8, left), top: Math.max(8, top) });
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) closeMenu();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", closeMenu);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", closeMenu);
    };
  }, [state, closeMenu]);

  const selectableIndexes = useMemo(
    () =>
      state
        ? state.items
            .map((item, index) => (item.type === "item" && !item.disabled ? index : -1))
            .filter((index) => index >= 0)
        : [],
    [state],
  );

  const onMenuKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!state) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const dir = event.key === "ArrowDown" ? 1 : -1;
        const current = selectableIndexes.indexOf(activeIndex);
        const nextPos =
          current === -1
            ? dir === 1
              ? 0
              : selectableIndexes.length - 1
            : (current + dir + selectableIndexes.length) % selectableIndexes.length;
        setActiveIndex(selectableIndexes[nextPos] ?? -1);
      } else if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        const item = state.items[activeIndex];
        if (item?.type === "item" && !item.disabled) {
          item.onSelect();
          closeMenu();
        }
      }
    },
    [state, selectableIndexes, activeIndex, closeMenu],
  );

  const value = useMemo<ContextMenuContextValue>(
    () => ({ openMenu, closeMenu }),
    [openMenu, closeMenu],
  );

  return (
    <ContextMenuContext.Provider value={value}>
      {children}
      {mounted && state
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              tabIndex={-1}
              onKeyDown={onMenuKeyDown}
              className="animate-scale-in border-border bg-overlay shadow-e2 fixed z-[200] min-w-44 rounded-lg border p-1 outline-none"
              style={{ left: position.left, top: position.top }}
              autoFocus
            >
              {state.items.map((item, index) => {
                if (item.type === "separator") {
                  return <div key={index} className="bg-border my-1 h-px" role="separator" />;
                }
                if (item.type === "label") {
                  return (
                    <div key={index} className="text-label text-fg-subtle px-2.5 py-1.5">
                      {item.label}
                    </div>
                  );
                }
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      item.onSelect();
                      closeMenu();
                    }}
                    className={cn(
                      "text-body-m flex h-8 w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-left outline-none",
                      "disabled:pointer-events-none disabled:opacity-50",
                      item.danger ? "text-danger" : "text-fg",
                      activeIndex === index && (item.danger ? "bg-danger-subtle" : "bg-elevated"),
                    )}
                  >
                    {Icon ? (
                      <Icon size={15} className="text-fg-subtle shrink-0" aria-hidden />
                    ) : null}
                    <span className="flex-1">{item.label}</span>
                    {item.shortcut ? (
                      <span className="text-caption text-fg-subtle">{item.shortcut}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </ContextMenuContext.Provider>
  );
}

function useContextMenuManager(): ContextMenuContextValue {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) throw new Error("useContextMenu must be used within <AppProvider>");
  return ctx;
}

/**
 * Returns an `onContextMenu` handler that opens a menu at the cursor. Pass a
 * static item list or a function of the event (for target-specific menus).
 */
export function useContextMenu(
  items: ContextMenuItem[] | ((event: ReactMouseEvent) => ContextMenuItem[]),
): (event: ReactMouseEvent) => void {
  const { openMenu } = useContextMenuManager();
  return useCallback(
    (event: ReactMouseEvent) => {
      event.preventDefault();
      const resolved = typeof items === "function" ? items(event) : items;
      openMenu(event.clientX, event.clientY, resolved);
    },
    [items, openMenu],
  );
}
