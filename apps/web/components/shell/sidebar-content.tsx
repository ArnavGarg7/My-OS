"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, Pin, PinOff } from "lucide-react";
import { MonoLabel } from "@myos/ui";
import { NAV_SECTIONS, getNavItem } from "@/lib/shell/nav";
import { usePins } from "@/lib/shell/use-pins";
import { SidebarNavItem } from "./sidebar-nav-item";

export interface SidebarContentProps {
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
}

/** Sections collapsed by default in the expanded sidebar — only Primary stays open (V2 IA pass). */
const DEFAULT_COLLAPSED = new Set(["Work", "Life", "Intelligence", "System"]);
const STORE_KEY = "myos.sidebar.sections";

function sectionHasActive(items: { href: string }[], pathname: string): boolean {
  return items.some((it) => pathname === it.href || pathname.startsWith(`${it.href}/`));
}

/** Hover-revealed pin/unpin control overlaid on a sidebar row (expanded mode only). */
function PinToggle({
  href,
  pinned,
  onToggle,
}: {
  href: string;
  pinned: boolean;
  onToggle: (href: string) => void;
}) {
  return (
    <button
      type="button"
      aria-label={pinned ? "Unpin from top" : "Pin to top"}
      title={pinned ? "Unpin from top" : "Pin to top"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle(href);
      }}
      className={`text-fg-subtle hover:text-fg hover:bg-overlay focus-visible:ring-ring absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 outline-none transition-opacity focus-visible:opacity-100 focus-visible:ring-1 ${
        pinned ? "opacity-60" : "opacity-0 group-hover:opacity-100"
      }`}
    >
      {pinned ? <PinOff size={12} aria-hidden /> : <Pin size={12} aria-hidden />}
    </button>
  );
}

/**
 * The scrollable nav body, shared by the desktop sidebar and the mobile drawer. So the ~37 routes don't
 * all shout at once (V2 IA pass): a user-pinned favorites row sits at the top, only Primary stays open by
 * default, the rest start collapsed but are one click away, the section containing the current page
 * auto-opens, and both the open/closed and pinned choices are remembered. Rows reveal a pin/unpin control
 * on hover. The icon-rail (collapsed) mode is unchanged.
 */
export function SidebarContent({ collapsed, onNavigate }: SidebarContentProps) {
  const pathname = usePathname();
  const { pinned, toggle: togglePin, isPinned } = usePins();

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

  // Resolve pinned hrefs to nav items, skipping any that no longer exist.
  const pinnedItems = pinned
    .map((href) => {
      try {
        return getNavItem(href);
      } catch {
        return null;
      }
    })
    .filter((item): item is ReturnType<typeof getNavItem> => item !== null);

  return (
    <nav aria-label="Primary" className="flex-1 space-y-3 overflow-y-auto px-2 py-2">
      {pinnedItems.length > 0 ? (
        <div className="space-y-1">
          <div className="px-2.5 py-1.5">
            <MonoLabel tone="subtle" aria-hidden>
              Pinned
            </MonoLabel>
          </div>
          <div className="space-y-0.5">
            {pinnedItems.map((item) => (
              <div key={item.href} className="group relative">
                <SidebarNavItem item={item} collapsed={false} onNavigate={onNavigate} />
                <PinToggle href={item.href} pinned onToggle={togglePin} />
              </div>
            ))}
          </div>
          <div aria-hidden className="bg-border mx-2.5 mt-2 h-px" />
        </div>
      ) : null}
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
                      <div className="group relative">
                        <SidebarNavItem item={item} collapsed={false} onNavigate={onNavigate} />
                        <PinToggle
                          href={item.href}
                          pinned={isPinned(item.href)}
                          onToggle={togglePin}
                        />
                      </div>
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
