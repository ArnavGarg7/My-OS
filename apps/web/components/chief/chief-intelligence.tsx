"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Compass, Lightbulb, ListChecks } from "lucide-react";
import { Badge, Button, Card, EmptyState, MonoLabel, Skeleton, Text } from "@myos/ui";
import { selectActionable } from "@myos/core/decision";
import { trpc, type RouterOutputs } from "@/lib/trpc/client";
import { useIntelligenceAction } from "@/lib/intelligence/use-intelligence-action";

type NowData = RouterOutputs["chief"]["now"];
type Signal = RouterOutputs["signals"]["current"]["signals"][number];
type Prediction = RouterOutputs["prediction"]["current"]["predictions"][number];

const CONFIDENCE_TONE: Record<string, "success" | "accent" | "warning" | "neutral"> = {
  very_high: "success",
  high: "success",
  medium: "accent",
  low: "warning",
};

function confidenceLabel(level: string) {
  const t = level.replace(/_/g, " ");
  return `${t.charAt(0).toUpperCase()}${t.slice(1)} confidence`;
}

/* ── NOW — the single grounded recommendation, wired to execution ──────────── */

export function NowRecommendation({ data }: { data: NowData }) {
  const [showWhy, setShowWhy] = useState(false);
  const rec = data.recommendation;
  const intel = useIntelligenceAction();
  const utils = trpc.useUtils();
  const fb = trpc.chief.feedback.useMutation();

  const action = intel.forRecommendation(rec.action, rec.ref ?? null, rec.estimateMinutes);

  return (
    <Card variant="hero" padding="lg" className="relative overflow-hidden">
      <div
        aria-hidden
        className="from-accent via-accent-hover absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r to-transparent"
      />
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-accent-muted text-accent-fg rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em]">
                Recommended now
              </span>
              {rec.ref?.module ? <MonoLabel tone="muted">{rec.ref.module}</MonoLabel> : null}
            </div>
            <Text variant="heading-xl" className="tracking-tight" asChild>
              <h2>{rec.title}</h2>
            </Text>
            <Text variant="body-m" tone="muted" className="max-w-xl">
              {rec.explanation.recommendation}
            </Text>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {rec.estimateMinutes !== null ? (
              <span className="text-accent-fg inline-flex items-center gap-1.5 font-mono text-sm font-semibold tabular-nums">
                {rec.estimateMinutes}m
              </span>
            ) : null}
            <Badge variant={CONFIDENCE_TONE[rec.confidence] ?? "neutral"} size="sm">
              {confidenceLabel(rec.confidence)}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {action ? (
              <Button disabled={intel.pending} onClick={action.run}>
                {action.label}
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => setShowWhy((s) => !s)}>
              {showWhy ? "Hide reasoning" : "Why this?"}
            </Button>
          </div>
          {data.provider.provider !== "local" ? (
            <MonoLabel tone="subtle">via {data.provider.provider}</MonoLabel>
          ) : (
            <MonoLabel tone="subtle" bead>
              grounded · local
            </MonoLabel>
          )}
        </div>

        {showWhy ? (
          <div className="border-border bg-inset/60 flex flex-col gap-3 rounded-lg border p-4">
            <ExplRow label="Situation" value={rec.explanation.situation} />
            <ExplRow label="Recommendation" value={rec.explanation.recommendation} />
            {rec.explanation.alternatives.length > 0 ? (
              <ExplRow label="Alternatives" value={rec.explanation.alternatives.join(" · ")} />
            ) : null}
            <ExplRow label="Cost of ignoring" value={rec.explanation.costOfIgnoring} />
          </div>
        ) : null}

        <div className="border-border flex items-center gap-2 border-t pt-3">
          <Text variant="body-s" tone="muted">
            Was this useful?
          </Text>
          {fb.data ? (
            <Text variant="body-s" tone="success">
              Thanks — I’ll factor that in.
            </Text>
          ) : (
            (
              [
                { outcome: "accepted", label: "Yes" },
                { outcome: "modified", label: "Partly" },
                { outcome: "rejected", label: "No" },
              ] as const
            ).map(({ outcome, label }) => (
              <Button
                key={outcome}
                variant="ghost"
                size="sm"
                disabled={fb.isPending || !data.recommendationId}
                onClick={() =>
                  fb.mutate(
                    { recommendationId: data.recommendationId, outcome },
                    { onSuccess: () => void utils.chief.now.invalidate() },
                  )
                }
              >
                {label}
              </Button>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

export function NowRecommendationSkeleton() {
  return (
    <Card variant="hero" padding="lg">
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-9 w-40" />
      </div>
    </Card>
  );
}

function ExplRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <MonoLabel tone="subtle">{label}</MonoLabel>
      <Text variant="body-s">{value}</Text>
    </div>
  );
}

/* ── AT RISK — real risk signals + at-risk forecasts, explainable + actionable ── */

const SIGNAL_SEVERITY: Record<string, "danger" | "warning" | "accent" | "neutral"> = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "accent",
  info: "neutral",
};

function SignalRow({ signal }: { signal: Signal }) {
  const [open, setOpen] = useState(false);
  const intel = useIntelligenceAction();
  const action = intel.forSignal(signal.relatedObjects);
  return (
    <div className="border-border bg-elevated rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Text variant="body-m" className="font-medium">
            {signal.explanation.headline}
          </Text>
          <Text variant="body-s" tone="muted">
            {signal.explanation.implication}
          </Text>
        </div>
        <Badge
          variant={SIGNAL_SEVERITY[signal.severity] ?? "neutral"}
          size="sm"
          className="shrink-0"
        >
          {signal.severity}
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <MonoLabel tone="subtle">confidence {Math.round(signal.confidence * 100)}%</MonoLabel>
        <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
          {open ? "Hide" : "Why?"}
        </Button>
        {action ? (
          <Button variant="secondary" size="sm" disabled={intel.pending} onClick={action.run}>
            {action.label}
          </Button>
        ) : null}
      </div>
      {open ? (
        <ul className="border-border mt-2 flex flex-col gap-1 border-t pt-2">
          {signal.explanation.reasons.map((r, i) => (
            <li key={i} className="text-body-s text-fg-muted flex gap-2">
              <span aria-hidden className="text-fg-subtle">
                ·
              </span>
              {r}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const OUTLOOK_TONE: Record<string, "danger" | "warning" | "success" | "neutral"> = {
  at_risk: "danger",
  on_track: "success",
  opportunity: "success",
  neutral: "neutral",
};

function PredictionRow({ prediction }: { prediction: Prediction }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-border bg-elevated rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Text variant="body-m" className="font-medium">
            {prediction.explanation.headline}
          </Text>
          <Text variant="body-s" tone="muted">
            {prediction.explanation.implication}
          </Text>
        </div>
        <Badge
          variant={OUTLOOK_TONE[prediction.outlook] ?? "neutral"}
          size="sm"
          className="shrink-0"
        >
          {prediction.outlook.replace(/_/g, " ")}
        </Badge>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <MonoLabel tone="subtle">
          {confidenceLabel(prediction.confidence.level)} · {prediction.horizonDays}d horizon
        </MonoLabel>
        {prediction.explanation.calculations.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setOpen((o) => !o)}>
            {open ? "Hide basis" : "Basis"}
          </Button>
        ) : null}
      </div>
      {open ? (
        <ul className="border-border mt-2 flex flex-col gap-1 border-t pt-2">
          {prediction.explanation.calculations.map((c, i) => (
            <li key={i} className="flex items-center justify-between gap-3">
              <Text variant="body-s" tone="muted">
                {c.label}
              </Text>
              <MonoLabel tone="muted">{c.value}</MonoLabel>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AtRiskPanel() {
  const signals = trpc.signals.current.useQuery(undefined, { refetchInterval: 180_000 });
  const predictions = trpc.prediction.current.useQuery(undefined, { refetchInterval: 180_000 });

  const riskSignals = (signals.data?.signals ?? [])
    .filter((s) => s.category === "risks")
    .slice(0, 4);
  const riskForecasts = (predictions.data?.risks ?? []).slice(0, 3);
  const loading = signals.isLoading || predictions.isLoading;
  const nothing = !loading && riskSignals.length === 0 && riskForecasts.length === 0;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <AlertTriangle size={15} aria-hidden className="text-danger" />
        <Text variant="heading-m">What's at risk</Text>
      </div>
      {loading ? (
        <Skeleton className="h-24 rounded-lg" />
      ) : nothing ? (
        <Card padding="none" className="border-dashed">
          <EmptyState
            icon={AlertTriangle}
            title="Nothing significant at risk"
            description="No deadline pressure, overload, or focus shortfall detected right now. Risks appear here the moment the data supports one — never before."
            className="py-8"
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {riskSignals.map((s) => (
            <SignalRow key={s.id} signal={s} />
          ))}
          {riskForecasts.map((p) => (
            <PredictionRow key={p.id} prediction={p} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── TO CONSIDER — opportunities (signals + forecasts) ─────────────────────── */

export function ConsiderPanel() {
  const signals = trpc.signals.current.useQuery(undefined, { refetchInterval: 180_000 });
  const predictions = trpc.prediction.current.useQuery(undefined, { refetchInterval: 180_000 });

  const oppSignals = (signals.data?.signals ?? [])
    .filter((s) => s.category === "opportunities")
    .slice(0, 3);
  const oppForecasts = (predictions.data?.opportunities ?? []).slice(0, 2);
  const loading = signals.isLoading || predictions.isLoading;
  const nothing = !loading && oppSignals.length === 0 && oppForecasts.length === 0;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Lightbulb size={15} aria-hidden className="text-accent-fg" />
        <Text variant="heading-m">Worth considering</Text>
      </div>
      {loading ? (
        <Skeleton className="h-24 rounded-lg" />
      ) : nothing ? (
        <Card padding="none" className="border-dashed">
          <EmptyState
            icon={Lightbulb}
            title="No open opportunities"
            description="Freed-up time, good-readiness windows, and momentum you could press will surface here as they appear."
            className="py-8"
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {oppSignals.map((s) => (
            <SignalRow key={s.id} signal={s} />
          ))}
          {oppForecasts.map((p) => (
            <PredictionRow key={p.id} prediction={p} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── PENDING DECISIONS — actionable only (Stage 1 selectActionable) ─────────── */

export function PendingDecisionsPanel() {
  const list = trpc.today.listDecisions.useQuery({});
  const actionable = list.data ? selectActionable(list.data, new Date()) : [];
  if (list.isLoading || actionable.length === 0) return null;

  const top = actionable[0]!;
  return (
    <Card variant="insight" padding="lg">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="bg-warning-subtle text-warning flex size-8 shrink-0 items-center justify-center rounded-lg">
            <ListChecks size={15} aria-hidden />
          </span>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <MonoLabel tone="warning">
                {actionable.length} decision{actionable.length === 1 ? "" : "s"} waiting
              </MonoLabel>
            </div>
            <Text variant="body-m">{top.title}</Text>
          </div>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/today#morning-recommendation">Review decisions</Link>
        </Button>
      </div>
    </Card>
  );
}

/* ── DAILY FRAME — greeting + the one-line situational summary ──────────────── */

export function ChiefFrame({
  morning,
  provider,
}: {
  morning: RouterOutputs["chief"]["morning"]["morning"] | null;
  provider: string;
}) {
  const summary =
    morning?.biggestRisk ??
    morning?.opportunity ??
    "Here's what My OS understands about your day right now — grounded in your real tasks, calendar and focus.";
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <MonoLabel tone="accent" bead>
          <Compass size={12} aria-hidden className="mr-1 inline" />
          Chief of Staff
        </MonoLabel>
        <span aria-hidden className="text-fg-disabled">
          ·
        </span>
        <MonoLabel tone="subtle">{provider === "local" ? "grounded · local" : provider}</MonoLabel>
      </div>
      <div className="flex flex-col gap-1">
        <Text variant="display-l" className="tracking-tight" asChild>
          <h1>{morning?.greeting ?? "Your Chief of Staff"}.</h1>
        </Text>
        <Text variant="body-l" tone="muted" className="max-w-2xl">
          {summary}
        </Text>
      </div>
    </header>
  );
}
