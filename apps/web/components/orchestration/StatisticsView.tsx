"use client";

import { Badge, StatBlock, Text } from "@myos/ui";
import type { PipelineKind } from "@myos/core/orchestration";
import { PIPELINE_LABEL } from "./orchestration-icons";

interface Statistics {
  totalRuns: number;
  runsToday: number;
  fullRuns: number;
  failedRuns: number;
  recoveredRuns: number;
  avgRuntimeMs: number;
  byPipeline: { pipeline: string; runs: number; failures: number }[];
}

/**
 * StatisticsView (Sprint 3.5). Portfolio-level derived stats over run history — totals,
 * full runs (>= 75% of modules touched), failures/recoveries, average runtime and a
 * per-pipeline breakdown. Always derived; orchestration stores nothing extra.
 */
export function StatisticsView({ statistics }: { statistics: Statistics }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatBlock label="Total runs" value={String(statistics.totalRuns)} />
        <StatBlock label="Today" value={String(statistics.runsToday)} />
        <StatBlock label="Full runs" value={String(statistics.fullRuns)} />
        <StatBlock label="Recovered" value={String(statistics.recoveredRuns)} />
        <StatBlock label="Failed" value={String(statistics.failedRuns)} />
        <StatBlock label="Avg runtime" value={`${statistics.avgRuntimeMs}ms`} />
      </div>

      {statistics.byPipeline.length > 0 ? (
        <section className="flex flex-col gap-1.5">
          <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
            By pipeline
          </Text>
          {statistics.byPipeline.map((p) => (
            <div
              key={p.pipeline}
              className="border-border-subtle flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <Text variant="body-s">
                {PIPELINE_LABEL[p.pipeline as PipelineKind] ?? p.pipeline}
              </Text>
              <div className="flex items-center gap-1.5">
                <Badge size="sm" variant="neutral">
                  {p.runs} runs
                </Badge>
                {p.failures > 0 ? (
                  <Badge size="sm" variant="danger">
                    {p.failures} failed
                  </Badge>
                ) : null}
              </div>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
