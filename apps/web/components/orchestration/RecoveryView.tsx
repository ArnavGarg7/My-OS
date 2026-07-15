"use client";

import { Badge, EmptyState, Text } from "@myos/ui";
import type { OrchestrationFailure } from "@myos/core/orchestration";
import { LifeBuoy } from "lucide-react";
import { MODULE_LABEL, STRATEGY_ICON, STRATEGY_LABEL } from "./orchestration-icons";

interface RecoveryRow {
  id: string;
  module: string;
  strategy: string;
  reason: string;
}

/**
 * RecoveryView (Sprint 3.5). Shows how the engine recovered from failures — the failed
 * step, the deterministic strategy applied and its reason. No cascading failures: a
 * single failed step never takes the whole run down.
 */
export function RecoveryView({
  failures,
  recovery,
}: {
  failures: OrchestrationFailure[];
  recovery: RecoveryRow[];
}) {
  if (failures.length === 0 && recovery.length === 0) {
    return (
      <EmptyState
        icon={LifeBuoy}
        title="No recovery needed"
        description="Every pipeline has completed cleanly. Recovery kicks in only when a step fails."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {recovery.length > 0 ? (
        <section className="flex flex-col gap-1.5">
          <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
            Recovery decisions
          </Text>
          {recovery.map((r) => {
            const Icon = STRATEGY_ICON[r.strategy as keyof typeof STRATEGY_ICON] ?? LifeBuoy;
            return (
              <div
                key={r.id}
                className="border-border-subtle flex items-start gap-2 rounded-md border px-3 py-2"
              >
                <Icon size={14} aria-hidden className="mt-0.5" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Text variant="body-s">
                      {MODULE_LABEL[r.module as keyof typeof MODULE_LABEL] ?? r.module}
                    </Text>
                    <Badge size="sm" variant="warning">
                      {STRATEGY_LABEL[r.strategy as keyof typeof STRATEGY_LABEL] ?? r.strategy}
                    </Badge>
                  </div>
                  <Text variant="caption" tone="subtle">
                    {r.reason}
                  </Text>
                </div>
              </div>
            );
          })}
        </section>
      ) : null}

      {failures.length > 0 ? (
        <section className="flex flex-col gap-1.5">
          <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
            Failures
          </Text>
          {failures.map((f, i) => (
            <div
              key={`${f.module}-${i}`}
              className="border-border-subtle flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <div className="flex flex-col">
                <Text variant="body-s">{MODULE_LABEL[f.module]}</Text>
                <Text variant="caption" tone="subtle">
                  {f.error}
                </Text>
              </div>
              <Badge size="sm" variant={f.recovered ? "warning" : "danger"}>
                {f.recovered ? "Recovered" : "Failed"}
              </Badge>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
