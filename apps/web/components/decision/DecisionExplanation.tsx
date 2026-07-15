"use client";

import { Badge } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * Deterministic explanation content (Sprint 2.3): rule, inputs, score breakdown.
 * Shared by the "Why?" dialog and the Command Center. No AI.
 */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-body-s text-fg-subtle">{label}</span>
      <span className="text-body-s text-fg text-right">{value}</span>
    </div>
  );
}

export function DecisionExplanation({
  decisionId,
  active = true,
}: {
  decisionId: string | null;
  active?: boolean;
}) {
  const query = trpc.today.explainDecision.useQuery(
    { id: decisionId ?? "" },
    { enabled: active && Boolean(decisionId) },
  );
  const data = query.data;

  if (query.isLoading || !data) {
    return <p className="text-body-s text-fg-subtle py-6 text-center">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="divide-border divide-y">
        <Row label="Rule fired" value={data.rule} />
        <Row label="Reason" value={data.reason} />
        <Row label="Confidence" value={`${data.confidence}%`} />
        <Row label="Score" value={String(data.score)} />
      </div>

      <div>
        <div className="text-label text-fg-subtle mb-2">Inputs</div>
        <div className="flex flex-wrap gap-1.5">
          {data.inputs.map((input) => (
            <Badge key={input} variant="neutral">
              {input}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <div className="text-label text-fg-subtle mb-2">Score breakdown</div>
        <ul className="flex flex-col gap-1">
          {data.breakdown.map((component, index) => (
            <li key={index} className="text-body-s flex items-center justify-between gap-4">
              <span className="text-fg-muted">{component.label}</span>
              <span className="text-fg font-mono tabular-nums">
                {component.value >= 0 ? "+" : ""}
                {component.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
