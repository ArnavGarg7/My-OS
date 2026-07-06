"use client";

import { Sparkles } from "lucide-react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@myos/ui";
import { useShellStore } from "@/lib/shell/store";

/** Quick Add modal — reusable shell overlay. Placeholder content (Phase 2). */
export function QuickAddDialog() {
  const open = useShellStore((state) => state.quickAddOpen);
  const setOpen = useShellStore((state) => state.setQuickAddOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Quick Add</DialogTitle>
          <DialogDescription>
            Capture a task, note, event, or expense from anywhere.
          </DialogDescription>
        </DialogHeader>
        <div className="border-border bg-inset flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-8 text-center">
          <span className="bg-accent-muted text-accent flex size-10 items-center justify-center rounded-full">
            <Sparkles size={18} aria-hidden />
          </span>
          <p className="text-body-m text-fg-muted">This feature will be implemented in Phase 2.</p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
