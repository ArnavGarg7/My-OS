import { cn } from "@myos/ui";
import type { DecisionPriority as Priority } from "@myos/core/decision";

const TONE: Record<Priority, string> = {
  critical: "text-danger",
  high: "text-warning",
  medium: "text-accent",
  low: "text-fg-subtle",
};

/** Priority label with a leading dot. */
export function DecisionPriority({ priority }: { priority: Priority }) {
  return (
    <span className={cn("text-label inline-flex items-center gap-1.5 uppercase", TONE[priority])}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {priority}
    </span>
  );
}
