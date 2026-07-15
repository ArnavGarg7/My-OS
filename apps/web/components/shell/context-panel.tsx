"use client";

import { usePathname } from "next/navigation";
import { PanelRightClose } from "lucide-react";
import { IconButton, Text } from "@myos/ui";
import { useShellStore } from "@/lib/shell/store";
import { resolveInspector } from "./inspector-registry";

/**
 * Optional right-hand context panel (lg+). Collapsed by default. Route-aware:
 * every page plugs into one Inspector registry (Sprint 2.8.5) — the panel just
 * resolves the active inspector for the current route.
 */
export function ContextPanel() {
  const open = useShellStore((state) => state.contextPanelOpen);
  const setOpen = useShellStore((state) => state.setContextPanelOpen);
  const pathname = usePathname();

  if (!open) return null;

  const Inspector = resolveInspector(pathname);

  return (
    <aside className="animate-slide-in-right border-border bg-surface hidden w-80 shrink-0 flex-col border-l [animation-fill-mode:both] lg:flex">
      <div className="border-border flex h-12 shrink-0 items-center justify-between border-b px-4">
        <Text variant="heading-s">Context</Text>
        <IconButton
          aria-label="Close context panel"
          size="icon-sm"
          variant="ghost"
          onClick={() => setOpen(false)}
        >
          <PanelRightClose size={16} aria-hidden />
        </IconButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {Inspector ? (
          <Inspector />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center">
            <Text variant="body-s" tone="subtle">
              Contextual details for the current view will appear here.
            </Text>
          </div>
        )}
      </div>
    </aside>
  );
}
