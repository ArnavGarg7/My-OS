"use client";

import { PageHeader, Tabs, TabsContent, TabsList, TabsTrigger } from "@myos/ui";
import { PageContainer, PageLoading } from "@/components/framework";
import { useOrchestration } from "./use-orchestration";
import { SummaryView } from "./SummaryView";
import { PipelineView } from "./PipelineView";
import { ExecutionPreview } from "./ExecutionPreview";
import { RunHistory } from "./RunHistory";
import { OrchestrationInspector } from "./OrchestrationInspector";
import { RecoveryView } from "./RecoveryView";
import { StatisticsView } from "./StatisticsView";

/**
 * OrchestrationPage (Sprint 3.5). The /orchestration route — where My OS runs itself as
 * one system. A readable, editorial control center: system status, the ten cross-module
 * pipelines, run history + inspector, recovery and statistics. Deterministic; no node
 * editor — every pipeline is a fixed, transparent, acyclic chain of existing engines.
 */
export function OrchestrationPage() {
  const o = useOrchestration();

  if (o.isLoading && o.history.length === 0 && !o.summary) {
    return <PageLoading label="Loading orchestration…" />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Orchestration"
        description="Every engine, cooperating automatically — one operating system, not twenty apps."
      />

      {o.summary ? <SummaryView summary={o.summary} /> : null}

      <Tabs defaultValue="pipelines">
        <TabsList>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines">
          <div className="flex flex-col gap-4">
            {o.preview ? <ExecutionPreview plan={o.preview} /> : null}
            <PipelineView onRun={o.runEvent} onPreview={o.previewEvent} pending={o.pending} />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="grid gap-6 lg:grid-cols-2">
            <RunHistory runs={o.history} selectedId={o.selectedId} onSelect={o.setSelectedId} />
            <div>
              {o.selected ? (
                <OrchestrationInspector run={o.selected} />
              ) : (
                <p className="text-fg-subtle text-sm">Select a run to inspect its steps.</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recovery">
          <RecoveryView
            failures={o.failures}
            recovery={o.recovery.map((r) => ({
              id: r.id,
              module: r.module,
              strategy: r.strategy,
              reason: r.reason,
            }))}
          />
        </TabsContent>

        <TabsContent value="stats">
          {o.statistics ? <StatisticsView statistics={o.statistics} /> : null}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
