import { formatRelativeTime } from "@myos/shared/format";
import { cn } from "@myos/ui";
import type { Decision, DecisionState } from "@myos/core/decision";
import { DecisionBadge } from "./DecisionBadge";

const DOT: Record<DecisionState, string> = {
  pending: "bg-warning",
  accepted: "bg-success",
  dismissed: "bg-fg-subtle",
  deferred: "bg-info",
  expired: "bg-fg-subtle",
  completed: "bg-success",
};

/** Vertical timeline of decisions (newest first). */
export function DecisionTimeline({ decisions }: { decisions: Decision[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {decisions.map((d) => (
        <li key={d.id} className="flex items-start gap-3">
          <span aria-hidden className={cn("mt-1.5 size-2 shrink-0 rounded-full", DOT[d.state])} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-body-m text-fg truncate">{d.title}</span>
              <DecisionBadge state={d.state} />
            </div>
            <span className="text-caption text-fg-subtle">{formatRelativeTime(d.createdAt)}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
