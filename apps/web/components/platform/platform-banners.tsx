"use client";

import { RefreshCw, WifiOff, X } from "lucide-react";
import { Button, IconButton } from "@myos/ui";
import { useConnection, useUpdates } from "@/lib/platform";

/**
 * Platform banners (Sprint 1.7): the update-available prompt and the offline
 * indicator. Both are provider-driven and render nothing when inactive.
 */
export function PlatformBanners() {
  const updates = useUpdates();
  const connection = useConnection();

  return (
    <>
      {updates.updateAvailable ? (
        <div className="border-border bg-accent-muted/40 text-body-s flex h-9 shrink-0 items-center gap-3 border-b px-4">
          <RefreshCw size={14} className="text-accent shrink-0" aria-hidden />
          <span className="text-fg min-w-0 flex-1 truncate">A new version of My OS is ready.</span>
          <Button size="sm" variant="primary" onClick={() => updates.applyUpdate()}>
            Reload
          </Button>
          <IconButton
            aria-label="Dismiss update"
            size="icon-sm"
            variant="ghost"
            onClick={() => updates.dismissUpdate()}
          >
            <X size={15} aria-hidden />
          </IconButton>
        </div>
      ) : null}

      {connection.offline ? (
        <div className="border-border bg-warning-subtle text-warning text-body-s flex h-8 shrink-0 items-center gap-2 border-b px-4">
          <WifiOff size={14} className="shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            You're offline. Cached pages still work; live features need a connection.
          </span>
        </div>
      ) : null}
    </>
  );
}
