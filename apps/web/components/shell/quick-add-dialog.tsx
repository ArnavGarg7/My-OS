"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@myos/ui";
import { useShellStore } from "@/lib/shell/store";
import { InboxQuickAdd } from "@/components/inbox/InboxQuickAdd";

/**
 * Quick Add modal — reusable shell overlay. Rebuilt in Sprint 2.4 to capture any
 * kind of item straight into the Universal Inbox (nothing is auto-categorized).
 */
export function QuickAddDialog() {
  const open = useShellStore((state) => state.quickAddOpen);
  const setOpen = useShellStore((state) => state.setQuickAddOpen);
  const setQuickAddType = useShellStore((state) => state.setQuickAddType);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuickAddType(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Quick Add</DialogTitle>
          <DialogDescription>
            Capture anything — it lands in your inbox until you decide where it goes.
          </DialogDescription>
        </DialogHeader>
        {open ? <InboxQuickAdd /> : null}
      </DialogContent>
    </Dialog>
  );
}
