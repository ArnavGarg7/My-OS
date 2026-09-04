"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { MonoLabel } from "@myos/ui";
import { NAV_SECTIONS } from "@/lib/shell/nav";
import { SidebarNavItem } from "./sidebar-nav-item";

export interface SidebarContentProps {
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
}

/** Sections collapsed by default in the expanded sidebar (the daily-drivers stay open). */
const DEFAULT_COLLAPSED = new Set(["Life", "Intelligence", "System"]);
const STORE_KEY = "myos.sidebar.sections";

function sectionHasActive(items: { href: string }[], pathname: string): boolean {
  return items.some((it) => pathname === it.href || pathname.startsWith(`${it.href}/`));
}

/**
 * The scrollable nav body, shared by the desktop sidebar and the mobile drawer. In the expanded
 * sidebar each section is collapsible so 32 routes don't all shout at once (UX pass 1): Main + Work
 * stay open, the rest start collapsed but are one click away, the section containing the current page
 * auto-opens, and the open/closed choice is remembered. The icon-rail (collapsed) mode is unchanged.
 */
export function SidebarContent({ collapsed, onNavigate }: SidebarContentProps) {
  const pathname = usePathname();

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NAV_SECTIONS.map((s) => [s.label, !DEFAULT_COLLAPSED.has(s.label)])),
  );

  // Restore the remembered open/closed choice (per-viewer, best-effort).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) setOpen((prev) => ({ ...prev, ...(JSON.parse(raw) as Record<string, boolean>) }));
    } catch {
      /* storage unavailable — defaults are fine */
    }
  }, []);

  // Always reveal the section that contains the current page.
  useEffect(() => {
    const active = NAV_SECTIONS.find((s) => sectionHasActive(s.items, pathname));
    if (active) setOpen((prev) => (prev[active.label] ? prev : { ...prev, [active.label]: true }));
  }, [pathname]);

  const toggle = (label: string) =>
    setOpen((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });

  // Icon-rail mode: everything shows as icons; section collapsing doesn't apply.
  if (collapsed) {
    return (
      <nav aria-label="Primary" className="flex-1 space-y-5 overflow-y-auto px-2 py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="space-y-1">
            <div aria-hidden className="bg-border mx-2.5 mb-1 h-px first:hidden" />
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarNavItem key={item.href} item={item} collapsed onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav aria-label="Primary" className="flex-1 space-y-3 overflow-y-auto px-2 py-2">
      {NAV_SECTIONS.map((section) => {
        const isOpen = open[section.label] ?? true;
        return (
          <div key={section.label} className="space-y-1">
            <button
              type="button"
              onClick={() => toggle(section.label)}
              aria-expanded={isOpen}
              title={section.blurb}
              className="text-fg-subtle hover:text-fg-muted flex w-full items-center justify-between rounded-sm px-2.5 py-1.5"
            >
              <MonoLabel tone="subtle" aria-hidden>
                {section.label}
              </MonoLabel>
              <ChevronRight
                size={12}
                aria-hidden
                className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
              />
            </button>
            {isOpen ? (
              <div className="space-y-0.5">
                {section.items.map((item, i) => {
                  const firstSecondary =
                    item.secondary === true && section.items[i - 1]?.secondary !== true;
                  return (
                    <div key={item.href}>
                      {firstSecondary ? (
                        <div aria-hidden className="bg-border mx-2.5 my-1.5 h-px" />
                      ) : null}
                      <SidebarNavItem item={item} collapsed={false} onNavigate={onNavigate} />
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
