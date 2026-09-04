"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, PanelRight, Plus, Search } from "lucide-react";
import {
  Breadcrumb,
  Button,
  IconButton,
  Kbd,
  SimpleTooltip,
  ThemeToggle,
  type BreadcrumbItemData,
} from "@myos/ui";
import { resolveActive } from "@/lib/shell/nav";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";
import { SystemStatusPopover } from "./system-status";
import { ProfileMenu } from "@/components/identity/profile-menu";

/** Application header. UI only — no functionality beyond opening shell overlays. */
export function TopBar() {
  const pathname = usePathname();
  const active = resolveActive(pathname);
  const title = active?.item.label ?? "My OS";

  const setCommandOpen = useShellStore((state) => state.setCommandOpen);
  const setQuickAddOpen = useShellStore((state) => state.setQuickAddOpen);
  const setMobileNavOpen = useShellStore((state) => state.setMobileNavOpen);
  const toggleContextPanel = useShellStore((state) => state.toggleContextPanel);

  const notifications = trpc.notification.active.useQuery(undefined, { refetchInterval: 60_000 });
  const unread = notifications.data?.length ?? 0;

  const crumbs: BreadcrumbItemData[] = active
    ? [
        { label: "Workspace", href: "/command-center" },
        { label: active.section.label },
        { label: active.item.label },
      ]
    : [{ label: "Workspace" }];

  return (
    <header
      className="animate-fade-in border-border bg-base/80 flex h-12 shrink-0 items-center gap-3 border-b px-3 backdrop-blur-md [animation-fill-mode:both] sm:px-4"
      style={{ animationDelay: "60ms" }}
    >
      {/* Left: mobile menu + breadcrumb/title */}
      <IconButton
        aria-label="Open navigation"
        size="icon-sm"
        variant="ghost"
        className="md:hidden"
        onClick={() => setMobileNavOpen(true)}
      >
        <Menu size={18} aria-hidden />
      </IconButton>

      <div className="min-w-0 flex-1">
        <div className="hidden sm:block">
          <Breadcrumb items={crumbs} />
        </div>
        <h1 className="text-heading-s text-fg truncate font-semibold sm:hidden">{title}</h1>
      </div>

      {/* Right: actions */}
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="mr-1 hidden lg:block">
          <SystemStatusPopover />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setCommandOpen(true)}
          className="text-fg-muted hidden sm:inline-flex"
          leftIcon={<Search size={15} aria-hidden />}
        >
          Search
          <span className="ml-4 flex items-center gap-0.5">
            <Kbd size="sm">⌘</Kbd>
            <Kbd size="sm">K</Kbd>
          </span>
        </Button>
        <IconButton
          aria-label="Search"
          size="icon-sm"
          variant="ghost"
          className="sm:hidden"
          onClick={() => setCommandOpen(true)}
        >
          <Search size={18} aria-hidden />
        </IconButton>

        <Button
          size="sm"
          onClick={() => setQuickAddOpen(true)}
          leftIcon={<Plus size={15} aria-hidden />}
        >
          <span className="hidden sm:inline">Quick add</span>
        </Button>

        <div className="bg-border mx-0.5 hidden h-5 w-px sm:block" />

        <SimpleTooltip content="Context panel">
          <IconButton
            aria-label="Toggle context panel"
            size="icon-sm"
            variant="ghost"
            className="hidden lg:inline-flex"
            onClick={toggleContextPanel}
          >
            <PanelRight size={18} aria-hidden />
          </IconButton>
        </SimpleTooltip>

        <ThemeToggle />

        <SimpleTooltip
          content={
            unread > 0 ? `${unread} notification${unread === 1 ? "" : "s"}` : "Notifications"
          }
        >
          <Button
            asChild
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
            size="icon-sm"
            variant="ghost"
            className="relative"
          >
            <Link href="/notifications">
              <Bell size={18} aria-hidden />
              {unread > 0 ? (
                <span
                  aria-hidden
                  className="bg-accent ring-base absolute right-1 top-1 size-1.5 rounded-full ring-2"
                />
              ) : null}
            </Link>
          </Button>
        </SimpleTooltip>

        <ProfileMenu />
      </div>
    </header>
  );
}
