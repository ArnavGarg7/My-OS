"use client";

import { useState } from "react";
import { Badge, Button, Card, Tabs, TabsContent, TabsList, TabsTrigger, Text } from "@myos/ui";
import { PageContainer, PageContent, PageHeader, PageLoading } from "@/components/framework";
import { trpc } from "@/lib/trpc/client";
import {
  OverviewTab,
  PromptRegistryTab,
  BenchmarkTab,
  CostIntelligenceTab,
  PerformanceTab,
  ReliabilityTab,
  TracesTab,
  EvaluationTab,
  SecurityTab,
} from "./DevConsole";

/**
 * AI Platform console (Sprint 5.1). An infrastructure dashboard for the AI Core Platform — NOT an
 * assistant. Each tab verifies one part of the pipeline (providers, prompts, context/budget, tools,
 * structured validation, streaming/generation, telemetry, evaluations, cost). Everything runs on
 * the deterministic local tier, so the console is fully functional with no keys and no network.
 */
export function AiConsole() {
  return (
    <PageContainer>
      <PageHeader
        title="AI Developer Console"
        description="The AI Core Platform + production observability — providers, prompts, benchmarking, cost, performance, reliability, traces, evaluation and security. Runs fully on the deterministic Local tier."
      />
      <PageContent>
        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="promptRegistry">Prompt Registry</TabsTrigger>
            <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
            <TabsTrigger value="costIntel">Cost</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="reliability">Reliability</TabsTrigger>
            <TabsTrigger value="traces">Traces</TabsTrigger>
            <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="context">Context</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="structured">Structured</TabsTrigger>
            <TabsTrigger value="generate">Streaming</TabsTrigger>
            <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="providers">
            <ProvidersTab />
          </TabsContent>
          <TabsContent value="promptRegistry">
            <PromptRegistryTab />
          </TabsContent>
          <TabsContent value="benchmark">
            <BenchmarkTab />
          </TabsContent>
          <TabsContent value="costIntel">
            <CostIntelligenceTab />
          </TabsContent>
          <TabsContent value="performance">
            <PerformanceTab />
          </TabsContent>
          <TabsContent value="reliability">
            <ReliabilityTab />
          </TabsContent>
          <TabsContent value="traces">
            <TracesTab />
          </TabsContent>
          <TabsContent value="evaluation">
            <EvaluationTab />
          </TabsContent>
          <TabsContent value="security">
            <SecurityTab />
          </TabsContent>
          <TabsContent value="context">
            <ContextTab />
          </TabsContent>
          <TabsContent value="tools">
            <ToolsTab />
          </TabsContent>
          <TabsContent value="structured">
            <StructuredTab />
          </TabsContent>
          <TabsContent value="generate">
            <GenerateTab />
          </TabsContent>
          <TabsContent value="telemetry">
            <TelemetryTab />
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageContainer>
  );
}

const HEALTH_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  healthy: "success",
  degraded: "warning",
  unavailable: "neutral",
};

function ProvidersTab() {
  const health = trpc.ai.health.useQuery();
  const providers = trpc.ai.providers.useQuery();
  if (health.isLoading || providers.isLoading) return <PageLoading />;
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-5">
        <Text variant="heading-s">Provider health</Text>
        <div className="flex flex-col gap-2">
          {health.data?.map((h) => (
            <div key={h.provider} className="flex items-center justify-between">
              <Text variant="body-m" className="capitalize">
                {h.provider}
              </Text>
              <div className="flex items-center gap-2">
                <Badge variant={HEALTH_VARIANT[h.state] ?? "neutral"}>{h.state}</Badge>
                <Text variant="body-s" className="text-fg-muted">
                  {h.detail}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <Text variant="heading-s">Models</Text>
          <Badge variant="accent">tier: {providers.data?.tier}</Badge>
        </div>
        <div className="divide-border flex flex-col divide-y">
          {providers.data?.models.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2">
              <div>
                <Text variant="body-m">{m.label}</Text>
                <Text variant="body-s" className="text-fg-muted">
                  {m.provider} · {m.capabilities.join(", ")}
                </Text>
              </div>
              <Text variant="body-s" className="text-fg-muted">
                ${m.inputCostPerMTok}/${m.outputCostPerMTok} per M
              </Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ContextTab() {
  const ctx = trpc.ai.context.useQuery({ feature: "assistant" });
  if (ctx.isLoading) return <PageLoading />;
  const b = ctx.data?.budget;
  return (
    <Card className="flex flex-col gap-3 p-5">
      <Text variant="heading-s">Context Budget Manager</Text>
      <Text variant="body-s" className="text-fg-muted">
        Feature <b>{ctx.data?.feature}</b> · {b?.totalTokens}/{b?.budget} tokens · dropped:{" "}
        {b?.dropped.join(", ") || "none"}
      </Text>
      <div className="divide-border flex flex-col divide-y">
        {ctx.data?.snapshots.map((s) => (
          <div key={s.builder} className="flex items-center justify-between py-2">
            <Text variant="body-m">{s.builder}</Text>
            <div className="flex items-center gap-2">
              <Text variant="body-s" className="text-fg-muted">
                {s.tokenEstimate} tok · priority {s.priority}
              </Text>
              <Badge
                variant={b?.included.some((i) => i.builder === s.builder) ? "success" : "neutral"}
              >
                {b?.included.some((i) => i.builder === s.builder) ? "included" : "dropped"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ToolsTab() {
  const tools = trpc.ai.tools.useQuery();
  if (tools.isLoading) return <PageLoading />;
  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-5">
        <Text variant="heading-s">Tool registry</Text>
        {tools.data?.tools.map((t) => (
          <div key={t.name} className="flex items-center justify-between py-1">
            <Text variant="body-m">{t.name}</Text>
            <Text variant="body-s" className="text-fg-muted">
              {t.permissions.join(", ") || "no perms"}
            </Text>
          </div>
        ))}
      </Card>
      <Card className="flex flex-col gap-2 p-5">
        <Text variant="heading-s">Executor demo (query_tasks)</Text>
        <Badge variant={tools.data?.demo.ok ? "success" : "danger"}>
          {tools.data?.demo.ok ? "ok" : "failed"}
        </Badge>
        <pre className="bg-elevated overflow-x-auto rounded p-3 text-xs">
          {JSON.stringify(tools.data?.demo.result, null, 2)}
        </pre>
      </Card>
    </div>
  );
}

function StructuredTab() {
  const s = trpc.ai.structured.useQuery();
  if (s.isLoading) return <PageLoading />;
  const row = (label: string, ok: boolean | undefined, repairs?: number) => (
    <div className="flex items-center justify-between py-2">
      <Text variant="body-m">{label}</Text>
      <div className="flex items-center gap-2">
        {repairs !== undefined ? (
          <Text variant="body-s" className="text-fg-muted">
            {repairs} repairs
          </Text>
        ) : null}
        <Badge variant={ok ? "success" : "danger"}>{ok ? "valid" : "rejected"}</Badge>
      </div>
    </div>
  );
  return (
    <Card className="divide-border flex flex-col divide-y p-5">
      <Text variant="heading-s" className="pb-2">
        Structured Output Framework
      </Text>
      {row("clean JSON", s.data?.valid.ok)}
      {row("fenced JSON (repaired)", s.data?.repaired.ok, s.data?.repaired.repairCount)}
      {row("garbage (rejected)", s.data?.invalid.ok)}
    </Card>
  );
}

function GenerateTab() {
  const [prompt, setPrompt] = useState("Summarise my week in one sentence.");
  const gen = trpc.ai.generate.useMutation();
  return (
    <Card className="flex flex-col gap-3 p-5">
      <Text variant="heading-s">Gateway generation demo (local tier)</Text>
      <textarea
        className="border-border bg-base min-h-20 rounded border p-3 text-sm"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <Button
        variant="primary"
        onClick={() => gen.mutate({ feature: "console", prompt })}
        disabled={gen.isPending}
      >
        {gen.isPending ? "Running…" : "Run through Gateway"}
      </Button>
      {gen.data ? (
        <div className="flex flex-col gap-2">
          <Text variant="body-m">{gen.data.response.text}</Text>
          <Text variant="body-s" className="text-fg-muted">
            provider {gen.data.response.provider} · {gen.data.response.usage.inputTokens}→
            {gen.data.response.usage.outputTokens} tok · {gen.data.lastEvent?.latencyMs}ms
          </Text>
        </div>
      ) : null}
    </Card>
  );
}

function TelemetryTab() {
  const tel = trpc.ai.telemetry.useQuery();
  if (tel.isLoading) return <PageLoading />;
  const a = tel.data?.aggregate;
  return (
    <Card className="flex flex-col gap-3 p-5">
      <Text variant="heading-s">Telemetry</Text>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Calls" value={a?.count ?? 0} />
        <Metric label="Input tok" value={a?.totalInputTokens ?? 0} />
        <Metric label="Output tok" value={a?.totalOutputTokens ?? 0} />
        <Metric label="Errors" value={a?.errors ?? 0} />
        <Metric label="Retries" value={a?.totalRetries ?? 0} />
        <Metric label="Repairs" value={a?.totalRepairs ?? 0} />
        <Metric label="Avg latency" value={`${a?.avgLatencyMs ?? 0}ms`} />
        <Metric label="Cost" value={`$${(a?.totalCostUsd ?? 0).toFixed(4)}`} />
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-border bg-elevated rounded border p-3">
      <Text variant="body-s" className="text-fg-muted">
        {label}
      </Text>
      <Text variant="heading-s">{value}</Text>
    </div>
  );
}
