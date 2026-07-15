"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@myos/ui";
import { DecisionExplanation } from "./DecisionExplanation";

/**
 * "Why?" dialog (Sprint 2.3) — wraps the deterministic explanation content.
 */
export function DecisionExplanationDialog({
  decisionId,
  open,
  onOpenChange,
}: {
  decisionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Why this decision?</DialogTitle>
          <DialogDescription>A deterministic explanation — no AI involved.</DialogDescription>
        </DialogHeader>
        <DecisionExplanation decisionId={decisionId} active={open} />
      </DialogContent>
    </Dialog>
  );
}
