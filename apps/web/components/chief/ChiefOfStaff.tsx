"use client";

import Link from "next/link";
import { MessageSquare, Sparkles, Wand2 } from "lucide-react";
import { Badge, Button, Card, MonoLabel, Text } from "@myos/ui";
import { PageContainer, PageContent } from "@/components/framework";
import { trpc } from "@/lib/trpc/client";
import {
  AtRiskPanel,
  ChiefFrame,
  ConsiderPanel,
  NowRecommendation,
  NowRecommendationSkeleton,
  PendingDecisionsPanel,
} from "./chief-intelligence";

/**
 * The Chief of Staff (Sprint 5.2; rebuilt as the Stage 3 intelligence brain).
 * Distinct from the Command Center: the Command Center is the operational home
 * ("what's happening, what do I do next"); the Chief explains WHY things matter,
 * what's at risk, what's worth considering, and what it would recommend — every
 * claim grounded in real My OS state (tasks, calendar, focus, decisions,
 * signals, predictions) and every recommendation wired into a real operation.
 * Runs on the deterministic local tier, so it works offline with no keys.
 */
export function ChiefOfStaff() {
  const now = trpc.chief.now.useQuery(undefined, { refetchInterval: 120_000 });
  const morning = trpc.chief.morning.useQuery();

  const provider = now.data?.provider.provider ?? "local";

  return (
    <PageContainer width="content">
      <PageContent className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 left-1/4 -z-10 h-48 w-2/3 rounded-full opacity-60 blur-3xl"
          style={{ background: "var(--glow-ambient)" }}
        />
        <div className="flex flex-col gap-8 pb-16">
          <ChiefFrame morning={morning.data?.morning ?? null} provider={provider} />

          {now.isLoading ? (
            <NowRecommendationSkeleton />
          ) : now.data ? (
            <NowRecommendation data={now.data} />
          ) : null}

          <PendingDecisionsPanel />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <AtRiskPanel />
            <ConsiderPanel />
          </div>

          <ProposalsPanel />

          <ChatCta />
        </div>
      </PageContent>
    </PageContainer>
  );
}

/* ── Planner proposals — the Chief's plan changes are always PROPOSALS ──────── */

function ProposalsPanel() {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Wand2 size={15} aria-hidden className="text-accent-fg" />
        <Text variant="heading-m">Ask the Chief to reshape your day</Text>
      </div>
      <Text variant="body-s" tone="muted" className="-mt-1">
        Every change is a proposal you review before anything is applied — the Chief never edits
        your plan on its own.
      </Text>
      <div className="grid gap-4 md:grid-cols-3">
        <OptimizePanel />
        <RescuePanel />
        <NightPanel />
      </div>
    </section>
  );
}

const CONFIDENCE_TONE: Record<string, "success" | "accent" | "warning" | "neutral"> = {
  very_high: "success",
  high: "success",
  medium: "accent",
  low: "warning",
};

function ProposalCard({
  title,
  description,
  onRun,
  pending,
  proposal,
  runLabel,
}: {
  title: string;
  description: string;
  onRun: () => void;
  pending: boolean;
  runLabel: string;
  proposal: { summary: string; confidence: string; changes: { reason: string }[] } | null;
}) {
  return (
    <Card padding="lg" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Text variant="heading-s">{title}</Text>
        <Text variant="body-s" tone="muted">
          {description}
        </Text>
      </div>
      <Button variant="secondary" size="sm" onClick={onRun} disabled={pending}>
        {pending ? "Working…" : runLabel}
      </Button>
      {proposal ? (
        <div className="border-border flex flex-col gap-1.5 border-t pt-3">
          <div className="flex items-center gap-2">
            <Text variant="body-s" className="font-medium">
              {proposal.summary}
            </Text>
            <Badge variant={CONFIDENCE_TONE[proposal.confidence] ?? "neutral"} size="sm">
              {proposal.confidence.replace(/_/g, " ")}
            </Badge>
          </div>
          {proposal.changes.slice(0, 3).map((c, i) => (
            <Text key={i} variant="body-s" tone="subtle">
              • {c.reason}
            </Text>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function OptimizePanel() {
  const m = trpc.chief.optimize.useMutation();
  return (
    <ProposalCard
      title="Optimize my day"
      description="Tighten the plan around what matters — proposed, never applied."
      runLabel="Optimize"
      onRun={() => m.mutate()}
      pending={m.isPending}
      proposal={m.data ?? null}
    />
  );
}

function RescuePanel() {
  const m = trpc.chief.rescue.useMutation();
  return (
    <ProposalCard
      title="Rescue my day"
      description="Reshuffle around what changed or slipped."
      runLabel="Rescue"
      onRun={() => m.mutate({ disruptions: [{ kind: "manual", detail: "manual rescue" }] })}
      pending={m.isPending}
      proposal={m.data ?? null}
    />
  );
}

function NightPanel() {
  const m = trpc.chief.night.useQuery(undefined, { enabled: false });
  return (
    <Card padding="lg" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Text variant="heading-s">Plan tomorrow</Text>
        <Text variant="body-s" tone="muted">
          Close today and draft tomorrow.
        </Text>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => void m.refetch()}
        disabled={m.isFetching}
      >
        {m.isFetching ? "Planning…" : "Plan tomorrow"}
      </Button>
      {m.data ? (
        <div className="border-border flex flex-col gap-0.5 border-t pt-3">
          <Text variant="body-s" className="font-medium">
            {m.data.proposal.summary}
          </Text>
          <Text variant="body-s" tone="subtle">
            {m.data.review.carryForward.length} task
            {m.data.review.carryForward.length === 1 ? "" : "s"} carried forward
          </Text>
        </div>
      ) : null}
    </Card>
  );
}

function ChatCta() {
  return (
    <Card
      variant="insight"
      padding="lg"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <div className="flex items-start gap-3">
        <span className="bg-accent-muted text-accent flex size-8 shrink-0 items-center justify-center rounded-lg">
          <MessageSquare size={15} aria-hidden />
        </span>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <MonoLabel tone="accent">Talk to your Chief</MonoLabel>
            <Sparkles size={12} aria-hidden className="text-accent-fg" />
          </div>
          <Text variant="body-s" tone="muted" className="max-w-xl">
            Ask anything in plain language — grounded in your real data, with citations. Changes are
            always proposed before they're applied.
          </Text>
        </div>
      </div>
      <Button asChild>
        <Link href="/chief/chat">Open chat →</Link>
      </Button>
    </Card>
  );
}
