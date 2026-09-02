import { CheckCircle2, HelpCircle } from "lucide-react";
import { formatRelativeTime } from "@myos/shared/format";
import { Badge, Button } from "@myos/ui";
import type { Decision, DeferOption } from "@myos/core/decision";
import { DecisionActions } from "./DecisionActions";
import { DecisionBadge } from "./DecisionBadge";
import { DecisionPriority } from "./DecisionPriority";
import { DecisionReason } from "./DecisionReason";

/** Turn a raw confidence percentage into a plain-language band (matches the Chief home wording). */
function confidenceWord(pct: number): string {
  if (pct >= 80) return "High confidence";
  if (pct >= 50) return "Medium confidence";
  return "Low confidence";
}

/**
 * Decision Card (Sprint 2.3). The OS's single "do this next" surface: title,
 * reason, confidence, priority, expiry + lifecycle actions. Read-only content —
 * no edit mode.
 */
export function DecisionCard({
  decision,
  onAccept,
  onDismiss,
  onDefer,
  onComplete,
  onWhy,
  pending,
}: {
  decision: Decision | null;
  onAccept: () => void;
  onDismiss: () => void;
  onDefer: (option: DeferOption) => void;
  onComplete: () => void;
  onWhy: () => void;
  pending: boolean;
}) {
  if (!decision) {
    return (
      <div className="border-border rounded-xl border border-dashed p-5 text-center">
        <p className="text-body-m text-fg-muted">No decision right now — you're all set.</p>
      </div>
    );
  }

  const expiresAt = decision.expiresAt ? new Date(decision.expiresAt) : null;
  const expiresLabel = expiresAt ? formatRelativeTime(expiresAt) : null;
  const isExpired = expiresAt ? expiresAt.getTime() < Date.now() : false;

  return (
    <div className="border-accent-border bg-accent-muted/20 flex flex-col gap-3 rounded-xl border p-5">
      <div className="flex items-center gap-3">
        <DecisionPriority priority={decision.priority} />
        {decision.state !== "pending" ? <DecisionBadge state={decision.state} /> : null}
        <Badge variant="neutral" className="ml-auto">
          {confidenceWord(decision.confidence)}
        </Badge>
      </div>

      <p className="text-heading-m text-fg">{decision.title}</p>
      <DecisionReason reason={decision.reason} />
      {expiresLabel && decision.state === "pending" ? (
        <p className={`text-caption ${isExpired ? "text-warning" : "text-fg-subtle"}`}>
          {isExpired ? "Expired" : "Expires"} {expiresLabel}
        </p>
      ) : null}

      {decision.state === "pending" ? (
        <DecisionActions
          onAccept={onAccept}
          onDismiss={onDismiss}
          onDefer={onDefer}
          onWhy={onWhy}
          pending={pending}
        />
      ) : decision.state === "accepted" ? (
        <div className="flex items-center gap-2">
          <Button
            onClick={onComplete}
            loading={pending}
            leftIcon={<CheckCircle2 size={15} aria-hidden />}
          >
            Mark complete
          </Button>
          <Button
            variant="ghost"
            className="ml-auto"
            onClick={onWhy}
            leftIcon={<HelpCircle size={15} aria-hidden />}
          >
            Why?
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-body-s text-fg-subtle">
            {decision.state === "deferred" && decision.deferredUntil
              ? `Deferred until ${formatRelativeTime(decision.deferredUntil)}`
              : `Decision ${decision.state}`}
          </span>
          <Button
            variant="ghost"
            className="ml-auto"
            onClick={onWhy}
            leftIcon={<HelpCircle size={15} aria-hidden />}
          >
            Why?
          </Button>
        </div>
      )}
    </div>
  );
}
