/** The plain, deterministic reason for a decision. */
export function DecisionReason({ reason }: { reason: string }) {
  return <p className="text-body-m text-fg-muted">{reason}</p>;
}
