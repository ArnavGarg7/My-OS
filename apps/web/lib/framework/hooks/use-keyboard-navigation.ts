"use client";

import { useCallback, useState, type KeyboardEvent } from "react";

export interface KeyboardNavigationOptions {
  itemCount: number;
  orientation?: "vertical" | "horizontal";
  loop?: boolean;
  initialIndex?: number;
  onSelect?: (index: number) => void;
}

export interface KeyboardNavigation {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

/**
 * Roving keyboard navigation for a list of items (Sprint 1.4). Handles
 * Arrow / Home / End / Enter. Rendering + focus are left to the caller.
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions): KeyboardNavigation {
  const { itemCount, orientation = "vertical", loop = true, initialIndex = 0, onSelect } = options;
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  const move = useCallback(
    (delta: number) => {
      setActiveIndex((current) => {
        if (itemCount === 0) return current;
        const next = current + delta;
        if (next < 0) return loop ? itemCount - 1 : 0;
        if (next >= itemCount) return loop ? 0 : itemCount - 1;
        return next;
      });
    },
    [itemCount, loop],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
      const prevKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
      switch (event.key) {
        case nextKey:
          event.preventDefault();
          move(1);
          break;
        case prevKey:
          event.preventDefault();
          move(-1);
          break;
        case "Home":
          event.preventDefault();
          setActiveIndex(0);
          break;
        case "End":
          event.preventDefault();
          setActiveIndex(Math.max(0, itemCount - 1));
          break;
        case "Enter":
          if (itemCount > 0) {
            event.preventDefault();
            onSelect?.(activeIndex);
          }
          break;
        default:
          break;
      }
    },
    [move, orientation, itemCount, onSelect, activeIndex],
  );

  return { activeIndex, setActiveIndex, onKeyDown };
}
