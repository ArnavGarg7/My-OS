import type { Decision } from "@myos/core/decision";
import { DecisionTimeline } from "./DecisionTimeline";

/** Full decision history for the day. */
export function DecisionHistory({ decisions }: { decisions: Decision[] }) {
  if (decisions.length === 0) {
    return (
      <p className="text-body-s text-fg-subtle py-6 text-center">
        No decisions logged yet — they'll appear here as the day unfolds.
      </p>
    );
  }
  return <DecisionTimeline decisions={decisions} />;
}
