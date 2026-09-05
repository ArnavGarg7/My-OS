"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ListChecks, Plus, Sun, Timer, type LucideIcon } from "lucide-react";
import { useShellStore } from "@/lib/shell/store";

/**
 * Mobile bottom navigation (Stage 8). An intentional mobile shell — the primary
 * destinations one thumb-tap away — NOT the desktop sidebar squeezed small. The full
 * navigation (every route) stays reachable via the drawer (top-bar menu). Same routes and
 * capabilities as desktop; only the information hierarchy adapts. Below `md` only.
 *
 * Center action is Quick Add — capture into My OS in seconds, the Stage 8 mobile priority.
 * Touch targets are ≥44px. Kinetic Obsidian throughout.
 */
const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/command-center", label: "Home", icon: LayoutGrid },
  { href: "/today", label: "Today", icon: Sun },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/focus", label: "Focus", icon: Timer },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const setQuickAddOpen = useShellStore((s) => s.setQuickAddOpen);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Primary"
      className="border-border bg-surface fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch justify-around border-t px-1 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {ITEMS.slice(0, 2).map((item) => (
        <NavButton key={item.href} {...item} active={isActive(item.href)} />
      ))}

      <button
        type="button"
        onClick={() => setQuickAddOpen(true)}
        aria-label="Quick add"
        className="relative flex min-w-[56px] flex-col items-center justify-center"
      >
        <span className="bg-accent text-on-accent -mt-5 flex size-12 items-center justify-center rounded-full shadow-lg">
          <Plus size={22} aria-hidden />
        </span>
        <span className="text-fg-subtle mt-0.5 text-[10px]">Add</span>
      </button>

      {ITEMS.slice(2).map((item) => (
        <NavButton key={item.href} {...item} active={isActive(item.href)} />
      ))}
    </nav>
  );
}

function NavButton({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] ${
        active ? "text-accent" : "text-fg-subtle"
      }`}
    >
      <Icon size={20} aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
