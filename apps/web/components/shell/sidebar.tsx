"use client";

import { useCallback, useState } from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { IconButton } from "@myos/ui";
import { SIDEBAR_DEFAULT_WIDTH, SIDEBAR_RAIL_WIDTH, useShellStore } from "@/lib/shell/store";
import { SidebarBrand } from "./sidebar-brand";
import { SidebarContent } from "./sidebar-content";
import { SidebarProfile } from "./sidebar-profile";
import { OmniLauncherButton } from "./omni-launcher-button";

/**
 * Desktop / tablet sidebar (md+). Collapsible to an icon rail, resizable within
 * a sensible min/max, persisted via the shell store. Below md it is hidden and
 * replaced by the MobileNav drawer.
 *
 * V2 Stage 1: the sidebar carries the Core Emblem identity, the Omni Launcher
 * trigger, the sectioned navigation, and the workspace identity footer — the
 * calm left edge of the operating system.
 */
export function Sidebar({ hydrated }: { hydrated: boolean }) {
  const collapsed = useShellStore((state) => state.collapsed) && hydrated;
  const storedWidth = useShellStore((state) => state.width);
  const toggleCollapsed = useShellStore((state) => state.toggleCollapsed);
  const setWidth = useShellStore((state) => state.setWidth);

  const width = collapsed ? SIDEBAR_RAIL_WIDTH : hydrated ? storedWidth : SIDEBAR_DEFAULT_WIDTH;
  const [resizing, setResizing] = useState(false);

  const onResizeStart = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = width;
      setResizing(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMove = (moveEvent: PointerEvent) => {
        setWidth(startWidth + (moveEvent.clientX - startX));
      };
      const onUp = () => {
        setResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [width, setWidth],
  );

  return (
    <aside
      style={{ width }}
      className={`animate-fade-in border-border bg-surface relative hidden shrink-0 flex-col border-r [animation-fill-mode:both] md:flex ${
        resizing
          ? ""
          : "transition-[width] duration-[var(--dur-base)] ease-[cubic-bezier(0.2,0,0,1)]"
      }`}
    >
      {/* Header: emblem + brand + collapse toggle */}
      <div className="flex h-14 shrink-0 items-center gap-2 px-3">
        {collapsed ? null : (
          <div className="min-w-0 flex-1">
            <SidebarBrand />
          </div>
        )}
        <IconButton
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          size="icon-sm"
          variant="ghost"
          onClick={toggleCollapsed}
          className={collapsed ? "mx-auto" : ""}
        >
          {collapsed ? (
            <PanelLeft size={16} aria-hidden />
          ) : (
            <PanelLeftClose size={16} aria-hidden />
          )}
        </IconButton>
      </div>

      {/* Omni Launcher */}
      <div className="px-2 pb-2">
        <OmniLauncherButton collapsed={collapsed} />
      </div>

      <SidebarContent collapsed={collapsed} />

      {/* Workspace identity footer */}
      <div className="border-border shrink-0 border-t p-2">
        <SidebarProfile collapsed={collapsed} />
      </div>

      {/* Resize handle (mouse only; keyboard users collapse with ⌘B) */}
      {collapsed ? null : (
        <div
          aria-hidden
          onPointerDown={onResizeStart}
          className="absolute inset-y-0 -right-1 z-10 w-2 cursor-col-resize"
        >
          <div
            className={`mx-auto h-full w-px transition-colors ${
              resizing ? "bg-accent" : "hover:bg-border-strong bg-transparent"
            }`}
          />
        </div>
      )}
    </aside>
  );
}
