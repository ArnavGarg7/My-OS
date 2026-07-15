import { Badge } from "@myos/ui";
import type { DecisionState } from "@myos/core/decision";

const MAP: Record<
  DecisionState,
  { variant: "warning" | "success" | "neutral" | "info"; label: string }
> = {
  pending: { variant: "warning", label: "Pending" },
  accepted: { variant: "success", label: "Accepted" },
  dismissed: { variant: "neutral", label: "Dismissed" },
  deferred: { variant: "info", label: "Deferred" },
  expired: { variant: "neutral", label: "Expired" },
  completed: { variant: "success", label: "Completed" },
};

/** Small state chip for a decision. */
export function DecisionBadge({ state }: { state: DecisionState }) {
  const { variant, label } = MAP[state];
  return <Badge variant={variant}>{label}</Badge>;
}
