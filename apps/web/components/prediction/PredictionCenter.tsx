"use client";

import { useState } from "react";
import { Badge, Button, Card, Tabs, TabsContent, TabsList, TabsTrigger, Text } from "@myos/ui";
import { PageContainer, PageContent, PageHeader, PageLoading } from "@/components/framework";
import { trpc, type RouterOutputs } from "@/lib/trpc/client";

/**
 * Prediction Center (Sprint 6.2, Phase 6). Surfaces the deterministic Predictive Intelligence Engine:
 * forecast feed, risk/opportunity forecasts, the prediction timeline, and scenario simulation. Every
 * forecast is deterministic, confidence-scored, explainable and immutable — the OS predicts, the AI
 * only explains. Nothing here mutates data; simulations are pure what-ifs.
 */

type Prediction = RouterOutputs["prediction"]["current"]["predictions"][number];

const CONFIDENCE: Record<string, "success" | "accent" | "warning" | "neutral"> = {
  very_high: "success",
  high: "success",
  medium: "accent",
  low: "warning",
};
const OUTLOOK: Record<string, "danger" | "success" | "accent" | "neutral"> = {
  at_risk: "danger",
  on_track: "success",
  opportunity: "accent",
  neutral: "neutral",
};

function ConfidenceBadge({ level, score }: { level: string; score: number }) {
  return (
    <Badge variant={CONFIDENCE[level] ?? "neutral"}>
      {level.replace("_", " ")} · {Math.round(score * 100)}%
    </Badge>
  );
}

export function PredictionCenter() {
  return (
    <PageContainer>
      <PageHeader
        title="Predictions"
        description="The Predictive Intelligence Engine — deterministic forecasts of what's likely to happen. The OS predicts; the AI only explains. Nothing here changes your plans."
      />
      <PageContent>
        <Tabs defaultValue="feed">
          <TabsList>
            <TabsTrigger value="feed">Forecasts</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="simulate">Simulate</TabsTrigger>
          </TabsList>
          <TabsContent value="feed">
            <ForecastFeed />
          </TabsContent>
          <TabsContent value="risks">
            <RiskForecasts />
          </TabsContent>
          <TabsContent value="opportunities">
            <OpportunityForecasts />
          </TabsContent>
          <TabsContent value="timeline">
            <PredictionTimeline />
          </TabsContent>
          <TabsContent value="simulate">
            <ScenarioSimulator />
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageContainer>
  );
}

function ForecastCard({ p }: { p: Prediction }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant={OUTLOOK[p.outlook] ?? "neutral"}>{p.outlook.replace("_", " ")}</Badge>
          <Text variant="body-m" className="truncate">
            {p.explanation.headline}
          </Text>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="neutral">{p.kind}</Badge>
          <ConfidenceBadge level={p.confidence.level} score={p.confidence.score} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Text variant="body-s" className="text-fg-muted">
          horizon {p.horizonDays}d
          {p.targetDate ? ` · by ${new Date(p.targetDate).toLocaleDateString()}` : ""}
        </Text>
        <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Why?"}
        </Button>
      </div>
      {open ? (
        <div className="border-border bg-elevated flex flex-col gap-1 rounded border p-3">
          {p.explanation.calculations.map((c, i) => (
            <div key={i} className="flex justify-between">
              <Text variant="body-s" className="text-fg-muted">
                {c.label}
              </Text>
              <Text variant="body-s">{c.value}</Text>
            </div>
          ))}
          <Text variant="body-s" className="mt-1">
            → {p.explanation.implication}
          </Text>
          {p.confidence.reasons.length > 0 ? (
            <Text variant="body-s" className="text-fg-muted mt-1">
              Confidence: {p.confidence.reasons.join("; ")}
            </Text>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-border bg-elevated rounded border px-4 py-2">
      <Text variant="body-s" className="text-fg-muted">
        {label}
      </Text>
      <Text variant="heading-s">{value}</Text>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card className="p-6">
      <Text variant="body-m" className="text-fg-muted">
        {text}
      </Text>
    </Card>
  );
}

function ForecastFeed() {
  const q = trpc.prediction.current.useQuery(undefined, { refetchInterval: 300_000 });
  if (q.isLoading) return <PageLoading />;
  const d = q.data;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Metric label="Forecasts" value={d?.counts.total ?? 0} />
        <Metric label="At risk" value={d?.counts.risks ?? 0} />
        <Metric label="Opportunities" value={d?.counts.opportunities ?? 0} />
        <Metric label="On track" value={d?.counts.onTrack ?? 0} />
      </div>
      {d && d.predictions.length > 0 ? (
        <div className="flex flex-col gap-2">
          {d.predictions.map((p) => (
            <ForecastCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <Empty text="No forecasts yet. As your history accumulates, deterministic predictions appear here." />
      )}
    </div>
  );
}

function RiskForecasts() {
  const q = trpc.prediction.current.useQuery();
  if (q.isLoading) return <PageLoading />;
  const risks = q.data?.risks ?? [];
  return risks.length > 0 ? (
    <div className="flex flex-col gap-2">
      {risks.map((p) => (
        <ForecastCard key={p.id} p={p} />
      ))}
    </div>
  ) : (
    <Empty text="No forecast risks. Deadlines, workload and habits all look likely to hold." />
  );
}

function OpportunityForecasts() {
  const q = trpc.prediction.current.useQuery();
  if (q.isLoading) return <PageLoading />;
  const opps = q.data?.opportunities ?? [];
  return opps.length > 0 ? (
    <div className="flex flex-col gap-2">
      {opps.map((p) => (
        <ForecastCard key={p.id} p={p} />
      ))}
    </div>
  ) : (
    <Empty text="No forecast opportunities right now. Upcoming free time and healthy schedules will surface here." />
  );
}

function PredictionTimeline() {
  const q = trpc.prediction.timeline.useQuery();
  if (q.isLoading) return <PageLoading />;
  return (
    <Card className="flex flex-col gap-2 p-5">
      <Text variant="heading-s">Prediction timeline (past → now → forecast)</Text>
      <div className="divide-border flex flex-col divide-y">
        {q.data?.points.map((pt, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Badge variant={pt.when === "current" ? "accent" : "neutral"}>{pt.when}</Badge>
              <div>
                <Text variant="body-m">{pt.label}</Text>
                <Text variant="body-s" className="text-fg-muted">
                  {pt.detail}
                </Text>
              </div>
            </div>
            <Text variant="body-s" className="text-fg-muted">
              {new Date(pt.at).toLocaleDateString()}
            </Text>
          </div>
        ))}
      </div>
    </Card>
  );
}

const SCENARIOS = [
  { kind: "add_focus_block", label: "Add a focus block" },
  { kind: "drop_task", label: "Drop a task" },
  { kind: "reduce_meetings", label: "Reduce meetings" },
  { kind: "extend_deadline", label: "Extend a deadline" },
  { kind: "move_workout", label: "Move workout" },
] as const;

function ScenarioSimulator() {
  const sim = trpc.prediction.simulate.useMutation();
  return (
    <Card className="flex flex-col gap-3 p-5">
      <Text variant="heading-s">Scenario simulator</Text>
      <Text variant="body-s" className="text-fg-muted">
        Try a hypothetical change against your current forecast. Nothing is modified — this is a
        pure what-if.
      </Text>
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <Button
            key={s.kind}
            variant="secondary"
            size="sm"
            disabled={sim.isPending}
            onClick={() => sim.mutate({ kind: s.kind })}
          >
            {s.label}
          </Button>
        ))}
      </div>
      {sim.data?.result ? (
        <div className="border-border bg-elevated flex flex-col gap-1 rounded border p-3">
          <div className="flex items-center justify-between">
            <Text variant="body-m" className="capitalize">
              {sim.data.result.scenario}
            </Text>
            <Badge variant={sim.data.result.netDelta >= 0 ? "success" : "warning"}>
              net {sim.data.result.netDelta >= 0 ? "+" : ""}
              {Math.round(sim.data.result.netDelta * 100)}%
            </Badge>
          </div>
          {sim.data.result.effects.map((e, i) => (
            <div key={i} className="flex justify-between">
              <Text variant="body-s" className="text-fg-muted">
                {e.label}
              </Text>
              <Text variant="body-s">{e.delta}</Text>
            </div>
          ))}
          <Text variant="body-s" className="text-fg-muted mt-1">
            confidence {sim.data.result.confidence.replace("_", " ")}
          </Text>
        </div>
      ) : sim.data && !sim.data.result ? (
        <Text variant="body-s" className="text-fg-muted">
          No baseline forecast to simulate against yet.
        </Text>
      ) : null}
    </Card>
  );
}
