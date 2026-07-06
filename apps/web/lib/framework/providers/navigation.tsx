"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS, resolveActive, type NavItem } from "@/lib/shell/nav";
import { usePersistentState } from "../hooks/use-persistent-state";
import { STORAGE_KEYS } from "../persistence";

const MAX_RECENT = 8;

interface NavigationContextValue {
  pathname: string;
  items: NavItem[];
  activeItem: NavItem | null;
  sectionLabel: string | null;
  recentPages: string[];
  navigate: (href: string) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

/** NavigationProvider — current route, breadcrumb source, recent pages. */
export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = resolveActive(pathname);
  const [recentPages, setRecentPages] = usePersistentState<string[]>(STORAGE_KEYS.recentPages, []);

  useEffect(() => {
    const resolved = resolveActive(pathname);
    if (!resolved) return;
    setRecentPages((prev) =>
      [resolved.item.href, ...prev.filter((href) => href !== resolved.item.href)].slice(
        0,
        MAX_RECENT,
      ),
    );
  }, [pathname, setRecentPages]);

  const navigate = useCallback((href: string) => router.push(href), [router]);

  const value = useMemo<NavigationContextValue>(
    () => ({
      pathname,
      items: NAV_ITEMS,
      activeItem: active?.item ?? null,
      sectionLabel: active?.section.label ?? null,
      recentPages,
      navigate,
    }),
    [pathname, active?.item, active?.section.label, recentPages, navigate],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useNavigation must be used within <AppProvider>");
  return ctx;
}
