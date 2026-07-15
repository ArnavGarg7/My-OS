"use client";

import { Plus } from "lucide-react";
import { Button } from "@myos/ui";
import { useShellStore } from "@/lib/shell/store";
import { InboxSearch } from "./InboxSearch";
import { InboxFilters } from "./InboxFilters";
import type { useInbox } from "./use-inbox";

/**
 * Inbox toolbar (Sprint 2.4): search · filter · sort · capture. Capture opens
 * the shared Quick Add overlay (which now captures into the inbox).
 */
export function InboxToolbar({ inbox }: { inbox: ReturnType<typeof useInbox> }) {
  const openQuickAdd = useShellStore((s) => s.setQuickAddOpen);

  return (
    <div className="border-border flex flex-col gap-3 border-b p-4">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <InboxSearch value={inbox.text} onChange={inbox.setText} />
        </div>
        <Button leftIcon={<Plus size={15} aria-hidden />} onClick={() => openQuickAdd(true)}>
          Capture
        </Button>
      </div>
      <InboxFilters
        status={inbox.status}
        onStatus={inbox.setStatus}
        type={inbox.type}
        onType={inbox.setType}
        sort={inbox.sort}
        onSort={inbox.setSort}
      />
    </div>
  );
}
