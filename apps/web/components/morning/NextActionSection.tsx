import { ArrowRight } from "lucide-react";
import { Button } from "@myos/ui";
import type { NextActionSection as NextActionData } from "@myos/core/morning";

/**
 * 5. Next Action — a single action, one button. The button executes the day's
 * real next action (Stage 2: launches a focus session on the top task); the
 * deterministic guidance from the Today engine stays as the hint below.
 */
export function NextActionSection({
  data,
  onAct,
  actionLabel,
}: {
  data: NextActionData;
  onAct: () => void;
  /** Overrides the generic engine label with the concrete action being taken. */
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        className="w-full justify-between sm:w-auto sm:min-w-80"
        onClick={onAct}
        rightIcon={<ArrowRight size={16} aria-hidden />}
      >
        {actionLabel ?? data.action}
      </Button>
      <p className="text-caption text-fg-subtle">{data.hint}</p>
    </div>
  );
}
