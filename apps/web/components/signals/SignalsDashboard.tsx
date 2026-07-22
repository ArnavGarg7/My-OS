"use client";

import { useState } from "react";
import { Badge, Button, Card, Tabs, TabsContent, TabsList, TabsTrigger, Text } from "@myos/ui";
import { PageContainer, PageContent, PageHeader, PageLoading } from "@/components/framework";
import { trpc, type RouterOutputs } from "@/lib/trpc/client";

/**
 * Event Intelligence dashboard (Sprint 6.1, Phase 6). Surfaces the deterministic Signal Engine: the
 * ranked signal feed, detected risks + opportunities, the replayable timeline, and per-signal
 * explanations. Everything is READ-ONLY situational awareness — no signal mutates data or triggers
 * anything. The Chief consumes the same signals as its primary input.
 */

type Signal = RouterOutputs["signals"]["current"]["signals"][number];

const SEVERITY: Record<string, "danger" | "warning" | "accent" | "neutral"> = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "accent",
  info: "neutral",
};
const LEVEL: Record<string, "danger" | "warning" | "success" | "accent" | "neutral"> = {
  critical: "danger",
  important: "warning",
  reminder: "accent",
  suggestion: "success",
  silent: "neutral",
};

export function SignalsDashboard() {
  return (
    <PageContainer>
      <PageHeader
        title="Signals"
        description="The Event Intelligence Engine — meaningful changes become ranked, explainable signals. The OS is paying attention; it still never acts on its own."
      />
      <PageContent>
        <Tabs defaultValue="feed">
          <TabsList>
            <TabsTrigger value="feed">Feed</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          <TabsContent value="feed">
            <SignalFeed />
          </TabsContent>
          <TabsContent value="risks">
            <RiskPanel />
          </TabsContent>
          <TabsContent value="opportunities">
            <OpportunityPanel />
          </TabsContent>
          <TabsContent value="timeline">
            <SignalTimeline />
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageContainer>
  );
}

function PriorityIndicator({ priority }: { priority: number }) {
  const variant =
    priority >= 68 ? "danger" : priority >= 50 ? "warning" : priority >= 32 ? "accent" : "neutral";
  return <Badge variant={variant}>P{Math.round(priority)}</Badge>;
}

function SignalBadge({ signal }: { signal: Signal }) {
  return (
    <div className="flex items-center gap-1.5">
      <Badge variant={SEVERITY[signal.severity] ?? "neutral"}>{signal.severity}</Badge>
      <Badge variant="neutral">{signal.category}</Badge>
      <Badge variant={LEVEL[signal.notify] ?? "neutral"}>{signal.notify}</Badge>
    </div>
  );
}

function SignalExplanation({ signal }: { signal: Signal }) {
  return (
    <div className="border-border bg-elevated mt-2 flex flex-col gap-1 rounded border p-3">
      {signal.explanation.reasons.map((r, i) => (
        <Text key={i} variant="body-s" className="text-fg-muted">
          • {r}
        </Text>
      ))}
      <Text variant="body-s" className="mt-1">
        → {signal.explanation.implication}
      </Text>
    </div>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  const [open, setOpen] = useState(false);
  const ack = trpc.signals.acknowledge.useMutation();
  const utils = trpc.useUtils();
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <PriorityIndicator priority={signal.ranking.priority} />
          <Text variant="body-m" className="truncate">
            {signal.explanation.headline}
          </Text>
        </div>
        <SignalBadge signal={signal} />
      </div>
      <div className="flex items-center gap-2">
        <Text variant="body-s" className="text-fg-muted">
          {signal.window.replace("_", " ")} · confidence {Math.round(signal.confidence * 100)}%
          {signal.relatedObjects[0]?.label ? ` · ${signal.relatedObjects[0].label}` : ""}
        </Text>
        <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Why?"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={ack.isPending}
          onClick={() =>
            ack.mutate(
              { signalId: signal.id },
              { onSuccess: () => void utils.signals.invalidate() },
            )
          }
        >
          Dismiss
        </Button>
      </div>
      {open ? <SignalExplanation signal={signal} /> : null}
    </Card>
  );
}

function SignalFeed() {
  const q = trpc.signals.current.useQuery(undefined, { refetchInterval: 120_000 });
  if (q.isLoading) return <PageLoading />;
  const data = q.data;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Metric label="Signals" value={data?.counts.total ?? 0} />
        <Metric label="Risks" value={data?.counts.risks ?? 0} />
        <Metric label="Opportunities" value={data?.counts.opportunities ?? 0} />
        <Metric label="Notifiable" value={data?.counts.notifiable ?? 0} />
      </div>
      {data && data.signals.length > 0 ? (
        <div className="flex flex-col gap-2">
          {data.signals.map((s) => (
            <SignalCard key={s.id} signal={s} />
          ))}
        </div>
      ) : (
        <EmptyState text="No active signals. The engine is watching — nothing needs your attention right now." />
      )}
    </div>
  );
}

function RiskPanel() {
  const q = trpc.signals.risks.useQuery();
  if (q.isLoading) return <PageLoading />;
  return q.data && q.data.signals.length > 0 ? (
    <div className="flex flex-col gap-2">
      {q.data.signals.map((s) => (
        <SignalCard key={s.id} signal={s} />
      ))}
    </div>
  ) : (
    <EmptyState text="No risks detected. Deadlines, readiness, focus and prep all look clear." />
  );
}

function OpportunityPanel() {
  const q = trpc.signals.opportunities.useQuery();
  if (q.isLoading) return <PageLoading />;
  return q.data && q.data.signals.length > 0 ? (
    <div className="flex flex-col gap-2">
      {q.data.signals.map((s) => (
        <SignalCard key={s.id} signal={s} />
      ))}
    </div>
  ) : (
    <EmptyState text="No opportunities right now. Freed time and good-readiness windows will surface here." />
  );
}

function SignalTimeline() {
  const q = trpc.signals.timeline.useQuery(undefined);
  if (q.isLoading) return <PageLoading />;
  return (
    <Card className="flex flex-col gap-2 p-5">
      <Text variant="heading-s">Signal timeline (replayable)</Text>
      {q.data && q.data.length > 0 ? (
        <div className="divide-border flex flex-col divide-y">
          {q.data.map((e, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Badge variant="neutral">{e.kind.replace(/_/g, " ")}</Badge>
                <Text variant="body-s">{e.detail}</Text>
              </div>
              <Text variant="body-s" className="text-fg-muted">
                {new Date(e.at).toLocaleTimeString()}
              </Text>
            </div>
          ))}
        </div>
      ) : (
        <Text variant="body-s" className="text-fg-muted">
          No timeline entries yet — signals will record their lifecycle here.
        </Text>
      )}
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

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="p-6">
      <Text variant="body-m" className="text-fg-muted">
        {text}
      </Text>
    </Card>
  );
}
