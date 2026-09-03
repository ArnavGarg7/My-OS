"use client";

import { usePathname } from "next/navigation";
import { PanelRightClose } from "lucide-react";
import { IconButton, InspectorEmpty, MonoLabel } from "@myos/ui";
import { useShellStore } from "@/lib/shell/store";
import { resolveInspector } from "./inspector-registry";

/**
 * The Contextual Inspector (lg+). Collapsed by default; opens on demand or when
 * an object is selected. Route-aware: every page plugs into one Inspector
 * registry (Sprint 2.8.5) — the panel resolves the active inspector for the
 * current route and renders it, or the resting empty state.
 */
export function ContextPanel() {
  const open = useShellStore((state) => state.contextPanelOpen);
  const setOpen = useShellStore((state) => state.setContextPanelOpen);
  const pathname = usePathname();

  if (!open) return null;

  const Inspector = resolveInspector(pathname);

  return (
    <aside className="animate-slide-in-right border-border bg-surface hidden w-[340px] shrink-0 flex-col border-l [animation-fill-mode:both] lg:flex">
      <div className="border-border flex h-14 shrink-0 items-center justify-between border-b px-4">
        <MonoLabel tone="muted">Inspector</MonoLabel>
        <IconButton
          aria-label="Close inspector"
          size="icon-sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          <PanelRightClose size={16} aria-hidden />
        </IconButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {Inspector ? <Inspector /> : <InspectorEmpty />}
      </div>
    </aside>
  );
}
