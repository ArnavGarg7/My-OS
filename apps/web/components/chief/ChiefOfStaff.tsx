"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, Text } from "@myos/ui";
import { PageContainer, PageContent, PageLoading } from "@/components/framework";
import { trpc, type RouterOutputs } from "@/lib/trpc/client";

type NowData = RouterOutputs["chief"]["now"];

/**
 * The AI Chief of Staff (Sprint 5.2) — the primary interface to My OS and its default homepage.
 * Opening the app answers "what should I be doing right now?" — a grounded, confidence-scored,
 * explainable recommendation with one-click actions. Every planner action (Optimize / Rescue /
 * Night) is a PROPOSAL surfaced here, never an edit. Runs on the deterministic local tier, so it
 * works offline with no keys.
 */
export function ChiefOfStaff() {
  const now = trpc.chief.now.useQuery(undefined, { refetchInterval: 120_000 });
  if (now.isLoading) return <PageLoading />;
  const data = now.data;

  return (
    <PageContainer>
      <PageContent>
        {data ? (
          <div className="flex flex-col gap-5">
            <ChatCta />
            <MorningSummary />
            <NowCard data={data} />
            <div className="grid gap-4 md:grid-cols-3">
              <OptimizePanel />
              <RescuePanel />
              <NightPanel />
            </div>
            <AIStatus provider={data.provider.provider} />
          </div>
        ) : (
          <Text variant="body-m">The Chief is thinking…</Text>
        )}
      </PageContent>
    </PageContainer>
  );
}

const CONFIDENCE_VARIANT: Record<string, "success" | "warning" | "neutral" | "accent"> = {
  very_high: "success",
  high: "success",
  medium: "accent",
  low: "warning",
};

function ConfidenceIndicator({ level }: { level: string }) {
  return (
    <Badge variant={CONFIDENCE_VARIANT[level] ?? "neutral"}>
      confidence: {level.replace("_", " ")}
    </Badge>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  return <Badge variant={provider === "local" ? "neutral" : "accent"}>via {provider}</Badge>;
}

function ChatCta() {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
      <div className="flex flex-col gap-1">
        <Text variant="heading-s">Talk to your Chief</Text>
        <Text variant="body-s" className="text-fg-muted">
          Ask anything in plain language — grounded in your real data, with citations. Changes are
          always proposed before they're applied.
        </Text>
      </div>
      <Link href="/chief/chat">
        <Button variant="primary">Open chat →</Button>
      </Link>
    </Card>
  );
}

function MorningSummary() {
  const morning = trpc.chief.morning.useQuery();
  if (morning.isLoading || !morning.data) return null;
  const m = morning.data.morning;
  return (
    <Card className="flex flex-col gap-3 p-6">
      <div className="flex items-center justify-between">
        <Text variant="display-m">{m.greeting} ☀️</Text>
        {m.readiness !== null ? (
          <div className="text-right">
            <Text variant="body-s" className="text-fg-muted">
              Readiness
            </Text>
            <Text variant="heading-l">{m.readiness}</Text>
          </div>
        ) : null}
      </div>
      {m.mission.length > 0 ? (
        <div className="flex flex-col gap-1">
          <Text variant="body-s" className="text-fg-muted">
            Today's focus
          </Text>
          {m.mission.map((p) => (
            <Text key={p.rank} variant="body-m">
              {p.rank}. {p.label}
            </Text>
          ))}
        </div>
      ) : null}
      {m.biggestRisk ? (
        <div>
          <Text variant="body-s" className="text-fg-muted">
            Today's biggest risk
          </Text>
          <Text variant="body-m">{m.biggestRisk}</Text>
        </div>
      ) : null}
      {m.opportunity ? (
        <div>
          <Text variant="body-s" className="text-fg-muted">
            Opportunity
          </Text>
          <Text variant="body-m">{m.opportunity}</Text>
        </div>
      ) : null}
    </Card>
  );
}

function NowCard({ data }: { data: NowData }) {
  const [showWhy, setShowWhy] = useState(false);
  const rec = data.recommendation;
  const fb = trpc.chief.feedback.useMutation();
  const utils = trpc.useUtils();

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <Text variant="body-s" className="text-fg-muted">
          Recommendation
        </Text>
        <div className="flex items-center gap-2">
          <ConfidenceIndicator level={rec.confidence} />
          <ProviderBadge provider={data.provider.provider} />
        </div>
      </div>
      <Text variant="heading-l">{rec.title}</Text>
      {rec.estimateMinutes !== null ? (
        <Text variant="body-s" className="text-fg-muted">
          Estimated: {rec.estimateMinutes} min
        </Text>
      ) : null}
      <Text variant="body-m">{rec.explanation.recommendation}</Text>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary">{primaryLabel(rec.action)}</Button>
        <Button variant="secondary" onClick={() => setShowWhy((s) => !s)}>
          Explain
        </Button>
        {rec.alternatives.slice(0, 2).map((a: { title: string }, i: number) => (
          <Button key={i} variant="ghost">
            {a.title}
          </Button>
        ))}
      </div>

      {showWhy ? <ExplanationPanel explanation={rec.explanation} /> : null}

      <div className="border-border flex items-center gap-2 border-t pt-3">
        <Text variant="body-s" className="text-fg-muted">
          Was this useful?
        </Text>
        {(["accepted", "modified", "rejected"] as const).map((o) => (
          <Button
            key={o}
            variant="ghost"
            size="sm"
            disabled={fb.isPending || !data.recommendationId}
            onClick={() =>
              fb.mutate(
                { recommendationId: data.recommendationId, outcome: o },
                { onSuccess: () => void utils.chief.now.invalidate() },
              )
            }
          >
            {o}
          </Button>
        ))}
        {fb.data ? (
          <Text variant="body-s" className="text-fg-muted">
            profile rev {fb.data.profile.revision}
          </Text>
        ) : null}
      </div>
    </Card>
  );
}

function ExplanationPanel({
  explanation,
}: {
  explanation: NowData["recommendation"]["explanation"];
}) {
  return (
    <div className="border-border bg-elevated flex flex-col gap-2 rounded border p-4">
      <Row label="Situation" value={explanation.situation} />
      <Row label="Recommendation" value={explanation.recommendation} />
      {explanation.alternatives.length > 0 ? (
        <Row label="Alternatives" value={explanation.alternatives.join("; ")} />
      ) : null}
      <Row label="Cost of ignoring" value={explanation.costOfIgnoring} />
      <Row label="Confidence" value={explanation.confidence.replace("_", " ")} />
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text variant="body-s" className="text-fg-muted">
        {label}
      </Text>
      <Text variant="body-m">{value}</Text>
    </div>
  );
}

function OptimizePanel() {
  const m = trpc.chief.optimize.useMutation();
  return (
    <ProposalPanel
      title="Optimize My Day"
      description="One-click plan improvements — proposed, never applied."
      onRun={() => m.mutate()}
      pending={m.isPending}
      proposal={m.data ?? null}
    />
  );
}
function RescuePanel() {
  const m = trpc.chief.rescue.useMutation();
  return (
    <ProposalPanel
      title="Rescue My Day"
      description="Reshuffle around what changed."
      onRun={() => m.mutate({ disruptions: [{ kind: "manual", detail: "manual rescue" }] })}
      pending={m.isPending}
      proposal={m.data ?? null}
    />
  );
}
function NightPanel() {
  const m = trpc.chief.night.useQuery(undefined, { enabled: false });
  return (
    <Card className="flex flex-col gap-3 p-5">
      <Text variant="heading-s">Night Planning</Text>
      <Text variant="body-s" className="text-fg-muted">
        Close today, draft tomorrow.
      </Text>
      <Button variant="secondary" onClick={() => void m.refetch()} disabled={m.isFetching}>
        {m.isFetching ? "Planning…" : "Plan tomorrow"}
      </Button>
      {m.data ? (
        <div>
          <Text variant="body-m">{m.data.proposal.summary}</Text>
          <Text variant="body-s" className="text-fg-muted">
            {m.data.review.carryForward.length} tasks carried forward
          </Text>
        </div>
      ) : null}
    </Card>
  );
}

function ProposalPanel({
  title,
  description,
  onRun,
  pending,
  proposal,
}: {
  title: string;
  description: string;
  onRun: () => void;
  pending: boolean;
  proposal: { summary: string; confidence: string; changes: { reason: string }[] } | null;
}) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <Text variant="heading-s">{title}</Text>
      <Text variant="body-s" className="text-fg-muted">
        {description}
      </Text>
      <Button variant="secondary" onClick={onRun} disabled={pending}>
        {pending ? "Working…" : title}
      </Button>
      {proposal ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Text variant="body-m">{proposal.summary}</Text>
            <ConfidenceIndicator level={proposal.confidence} />
          </div>
          {proposal.changes.slice(0, 3).map((c, i) => (
            <Text key={i} variant="body-s" className="text-fg-muted">
              • {c.reason}
            </Text>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function AIStatus({ provider }: { provider: string }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant={provider === "local" ? "neutral" : "success"}>
        {provider === "local" ? "Offline-ready · Local provider" : `AI online · ${provider}`}
      </Badge>
      <Text variant="body-s" className="text-fg-muted">
        Every recommendation is grounded in your deterministic data.
      </Text>
    </div>
  );
}

function primaryLabel(action: string): string {
  switch (action) {
    case "start_focus":
      return "Start Focus Session";
    case "start_block":
      return "Start Block";
    case "take_break":
      return "Take a Break";
    case "reschedule":
      return "Rescue My Day";
    case "review":
      return "Review Decisions";
    case "plan":
      return "Plan My Day";
    default:
      return "Continue";
  }
}
