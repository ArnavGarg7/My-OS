"use client";

import { usePathname, useRouter } from "next/navigation";
import { NavigationItem, SimpleTooltip } from "@myos/ui";
import type { NavItem } from "@/lib/shell/nav";

export interface SidebarNavItemProps {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
}

/**
 * A single sidebar row. Uses the design-system NavigationItem and drives SPA
 * navigation via the router (the design system is framework-agnostic, so the
 * app owns routing). Collapsed rows show the label as a tooltip.
 */
export function SidebarNavItem({ item, collapsed, onNavigate }: SidebarNavItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

  const node = (
    <NavigationItem
      icon={item.icon}
      active={active}
      collapsed={collapsed}
      onClick={() => {
        router.push(item.href);
        onNavigate?.();
      }}
    >
      {item.label}
    </NavigationItem>
  );

  if (collapsed) {
    return (
      <SimpleTooltip content={item.label} side="right">
        {node}
      </SimpleTooltip>
    );
  }
  return node;
}
