"use client";

import { Text } from "@myos/ui";
import { NAV_SECTIONS } from "@/lib/shell/nav";
import { SidebarNavItem } from "./sidebar-nav-item";

export interface SidebarContentProps {
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
}

/** The scrollable nav body, shared by the desktop sidebar and the mobile drawer. */
export function SidebarContent({ collapsed, onNavigate }: SidebarContentProps) {
  return (
    <nav aria-label="Primary" className="flex-1 space-y-5 overflow-y-auto px-2 py-2">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="space-y-1">
          {collapsed ? (
            <div aria-hidden className="bg-border mx-2.5 mb-1 h-px first:hidden" />
          ) : (
            <Text
              variant="label"
              tone="subtle"
              className="px-2.5 uppercase tracking-wider"
              aria-hidden
            >
              {section.label}
            </Text>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <SidebarNavItem
                key={item.href}
                item={item}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
