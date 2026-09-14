"use client";

import { useState } from "react";
import {
  BarChart3,
  CalendarCheck,
  Fingerprint,
  Lightbulb,
  Repeat,
  Scale,
  SlidersHorizontal,
  Sunrise,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  cn,
} from "@myos/ui";
import { PageContainer, PageContent, PageHeader, PageLoading } from "@/components/framework";
import { trpc } from "@/lib/trpc/client";

/**
 * Personal Intelligence Center (Sprint 6.5, Phase 6 finale). The Adaptive Personal Intelligence
 * surface: inspect the deterministic Personal Profile the OS has learned — preferences, habits,
 * routines, insights, behavioral analytics — plus weekly/monthly reviews and feedback. Every learned
 * value is confidence-scored + evidence-backed and the user can edit, disable, approve or delete it.
 * **The system adapts; it never guesses.** No AI writes anything here; personalization shapes
 * presentation, never business logic.
 */

const CONF: Record<string, "success" | "accent" | "warning" | "neutral"> = {
  very_high: "success",
  high: "success",
  medium: "accent",
  low: "warning",
  unknown: "neutral",
};
const CONF_LABEL: Record<string, string> = {
  very_high: "Very high",
  high: "High",
  medium: "Medium",
  low: "Low",
  unknown: "Unknown",
};

function ConfidenceBadge({ level, caption }: { level: string; caption?: string }) {
  return (
    <Badge variant={CONF[level] ?? "neutral"}>
      {caption ?? CONF_LABEL[level] ?? level.replace("_", " ")}
    </Badge>
  );
}

export function PersonalIntelligenceCenter() {
  return (
    <PageContainer>
      <PageHeader
        title="Personal Intelligence"
        description="What the OS has learned about you, from your own behaviour and feedback — deterministic, evidence-backed and fully under your control. The system adapts; it never guesses, and the AI never learns on its own."
      />
      <PageContent>
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="habits">Habits</TabsTrigger>
            <TabsTrigger value="routines">Routines</TabsTrigger>
            <TabsTrigger value="estimation">Estimation</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <Profile />
          </TabsContent>
          <TabsContent value="preferences">
            <Preferences />
          </TabsContent>
          <TabsContent value="habits">
            <Habits />
          </TabsContent>
          <TabsContent value="routines">
            <Routines />
          </TabsContent>
          <TabsContent value="estimation">
            <Estimation />
          </TabsContent>
          <TabsContent value="insights">
            <Insights />
          </TabsContent>
          <TabsContent value="reviews">
            <Reviews />
          </TabsContent>
          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>
          <TabsContent value="settings">
            <Settings />
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageContainer>
  );
}

function Empty({
  icon = Fingerprint,
  title,
  text,
}: {
  icon?: LucideIcon;
  title: string;
  text: string;
}) {
  return <EmptyState icon={icon} title={title} description={text} />;
}

/**
 * Estimate-vs-reality (Stage 5). Observed behaviour — how the user's own estimates
 * compare to time actually recorded (via task-linked focus). Honest "not enough
 * evidence yet" below the floor; never invents a bias.
 */
function Estimation() {
  const q = trpc.adaptation.estimation.useQuery();
  if (q.isLoading) return <PageLoading />;
  const e = q.data;
  if (!e || e.direction === "unknown") {
    return (
      <Empty
        icon={Scale}
        title="Not enough evidence yet"
        text={
          e?.detail ??
          "Once you complete tasks that have an estimate and focus time, My OS learns how your estimates compare to reality."
        }
      />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <Text variant="heading-s">{e.headline}</Text>
          <ConfidenceBadge level={e.confidence.level} />
        </div>
        <Text variant="body-s" className="text-fg-muted">
          Your recent activity shows: {e.detail}
        </Text>
        <div className="border-border mt-1 flex flex-wrap gap-4 border-t pt-3">
          <Metric label="Sample" value={`${e.sampleSize} tasks`} />
          <Metric label="Actual vs estimate" value={`${Math.round((e.biasRatio ?? 1) * 100)}%`} />
          <Metric
            label="Planning adjustment"
            value={
              e.adjustmentFactor === 1 ? "not yet applied" : `×${e.adjustmentFactor.toFixed(2)}`
            }
          />
        </div>
        <Text variant="caption" className="text-fg-subtle">
          Based on {e.evidence.detail}. Your original estimates are never changed — My OS only
          learns a bias to make planning realistic.
        </Text>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <Text variant="caption" className="text-fg-subtle uppercase tracking-wide">
        {label}
      </Text>
      <Text variant="body-m">{value}</Text>
    </div>
  );
}

function Profile() {
  const q = trpc.adaptation.profile.useQuery();
  if (q.isLoading) return <PageLoading />;
  const cats = q.data ? Object.entries(q.data.byCategory) : [];
  return q.data ? (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <Text variant="heading-s">Profile maturity</Text>
            <Text variant="body-s" className="text-fg-muted">
              {q.data.fieldCount} learned field{q.data.fieldCount === 1 ? "" : "s"} across{" "}
              {cats.length} categories.
            </Text>
          </div>
          <Text variant="heading-m">{Math.round(q.data.maturity * 100)}%</Text>
        </div>
        <Progress value={Math.round(q.data.maturity * 100)} />
      </Card>
      {cats.length === 0 ? (
        <Empty
          icon={Fingerprint}
          title="Nothing learned yet"
          text="As you use the OS, confident preferences appear here with their evidence."
        />
      ) : (
        cats.map(([category, fields]) => (
          <Card key={category} className="flex flex-col gap-2 p-4">
            <Text variant="body-m" className="capitalize">
              {category.replace("_", " ")}
            </Text>
            {fields.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-2">
                <Text variant="body-s">
                  {f.key.replace(/_/g, " ")}: <span className="text-fg">{String(f.value)}</span>
                </Text>
                <ConfidenceBadge level={f.confidence.level} />
              </div>
            ))}
          </Card>
        ))
      )}
    </div>
  ) : (
    <Empty
      icon={Fingerprint}
      title="No profile yet"
      text="Your learned profile will appear here."
    />
  );
}

function Preferences() {
  const q = trpc.adaptation.preferences.useQuery();
  const edit = trpc.adaptation.editPreference.useMutation();
  const utils = trpc.useUtils();
  if (q.isLoading) return <PageLoading />;
  const refresh = () => void utils.adaptation.invalidate();
  return q.data && q.data.preferences.length > 0 ? (
    <div className="flex flex-col gap-2">
      <Text variant="body-s" className="text-fg-muted">
        {q.data.actionable} preference(s) confident enough to act on. Edit or disable any — it's
        yours.
      </Text>
      {q.data.preferences.map((p) => (
        <Card key={p.key} className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Text variant="body-m" className="truncate">
                {p.key.replace(/_/g, " ")}: {String(p.value)}
              </Text>
              <Badge variant="neutral">{p.source}</Badge>
              {!p.enabled ? <Badge variant="warning">disabled</Badge> : null}
            </div>
            <ConfidenceBadge level={p.confidence.level} caption={p.caption} />
          </div>
          <Text variant="body-s" className="text-fg-muted">
            {p.explanation}
          </Text>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={edit.isPending}
              onClick={() =>
                edit.mutate({ key: p.key, enabled: !p.enabled }, { onSuccess: refresh })
              }
            >
              {p.enabled ? "Disable" : "Enable"}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  ) : (
    <Empty
      icon={SlidersHorizontal}
      title="No preferences learned yet"
      text="Confident, actionable preferences appear here once the OS has enough evidence."
    />
  );
}

function Habits() {
  const q = trpc.adaptation.habits.useQuery();
  if (q.isLoading) return <PageLoading />;
  return q.data && q.data.habits.length > 0 ? (
    <div className="flex flex-col gap-2">
      {q.data.habits.map((h) => (
        <Card key={h.key} className="flex flex-col gap-1 p-4">
          <div className="flex items-center justify-between gap-2">
            <Text variant="body-m">{h.key.replace(/_/g, " ")}</Text>
            <div className="flex items-center gap-1.5">
              <Badge
                variant={
                  h.trend === "rising" ? "success" : h.trend === "declining" ? "warning" : "neutral"
                }
              >
                {h.trend}
              </Badge>
              <ConfidenceBadge level={h.confidence.level} />
            </div>
          </div>
          <Text variant="body-s" className="text-fg-muted">
            strength {pct(h.strength)} · consistency {pct(h.consistency)} · break risk{" "}
            {pct(h.breakProbability)} · recovery {pct(h.recoveryRate)}
          </Text>
        </Card>
      ))}
    </div>
  ) : (
    <Empty
      icon={Repeat}
      title="No habit models yet"
      text="They form once enough completion history exists."
    />
  );
}

function Routines() {
  const q = trpc.adaptation.routines.useQuery();
  if (q.isLoading) return <PageLoading />;
  return q.data && q.data.routines.length > 0 ? (
    <div className="flex flex-col gap-2">
      {q.data.routines.map((r) => (
        <Card key={r.key} className="flex items-center justify-between gap-2 p-4">
          <div>
            <Text variant="body-m">{r.label.replace(/_/g, " ")}</Text>
            <Text variant="body-s" className="text-fg-muted">
              {r.evidence.detail}
            </Text>
          </div>
          <ConfidenceBadge level={r.confidence.level} />
        </Card>
      ))}
    </div>
  ) : (
    <Empty
      icon={Sunrise}
      title="No routines discovered yet"
      text="They require repeated evidence before the OS is confident."
    />
  );
}

function Insights() {
  const q = trpc.adaptation.insights.useQuery();
  if (q.isLoading) return <PageLoading />;
  return q.data && q.data.insights.length > 0 ? (
    <div className="flex flex-col gap-2">
      {q.data.insights.map((i) => (
        <Card key={i.id} className="flex flex-col gap-1 p-4">
          <div className="flex items-center justify-between gap-2">
            <Text variant="body-m">{i.headline}</Text>
            <ConfidenceBadge level={i.confidence.level} caption={i.caption} />
          </div>
          <Text variant="body-s" className="text-fg-muted">
            {i.detail}
          </Text>
          {i.evidence.observations > 0 ? (
            <Text variant="body-s" className="text-fg-subtle">
              Evidence: {i.evidence.observations} observations over {i.evidence.timeSpanDays} days.
            </Text>
          ) : null}
        </Card>
      ))}
    </div>
  ) : (
    <Empty
      icon={Lightbulb}
      title="No insights yet"
      text="They appear once the OS is confident enough to explain a pattern."
    />
  );
}

function Reviews() {
  const [range, setRange] = useState<"weekly" | "monthly">("weekly");
  const weekly = trpc.adaptation.weeklyReview.useQuery(undefined, { enabled: range === "weekly" });
  const monthly = trpc.adaptation.monthlyReview.useQuery(undefined, {
    enabled: range === "monthly",
  });
  const q = range === "weekly" ? weekly : monthly;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant={range === "weekly" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setRange("weekly")}
        >
          Weekly
        </Button>
        <Button
          variant={range === "monthly" ? "primary" : "ghost"}
          size="sm"
          onClick={() => setRange("monthly")}
        >
          Monthly
        </Button>
      </div>
      {q.isLoading ? (
        <PageLoading />
      ) : range === "weekly" && weekly.data ? (
        <Card className="flex flex-col gap-3 p-5">
          <Text variant="heading-s">
            Week of {weekly.data.periodStart} → {weekly.data.periodEnd}
          </Text>
          <Section title="Achievements" items={weekly.data.achievements} />
          <Section title="Emerging habits" items={weekly.data.emergingHabits} />
          <Section title="Risks" items={weekly.data.risks} />
          <Section title="Opportunities" items={weekly.data.opportunities} />
          <Text variant="body-s" className="text-fg-muted">
            Recommendation quality: {Math.round(weekly.data.recommendationQuality * 100)}%
          </Text>
        </Card>
      ) : range === "monthly" && monthly.data ? (
        <Card className="flex flex-col gap-3 p-5">
          <Text variant="heading-s">
            Month {monthly.data.periodStart} → {monthly.data.periodEnd}
          </Text>
          <Section title="Long-term trends" items={monthly.data.longTermTrends} />
          <Line label="Productivity" value={monthly.data.productivityEvolution} />
          <Line label="Habits" value={monthly.data.habitEvolution} />
          <Line label="Focus" value={monthly.data.focusEvolution} />
          <Line label="System adaptation" value={monthly.data.systemAdaptation} />
        </Card>
      ) : (
        <Empty
          icon={CalendarCheck}
          title="No review data yet"
          text="Weekly and monthly reviews appear once there's a period of activity to summarise."
        />
      )}
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <Text variant="body-m">{title}</Text>
      {items.map((it, i) => (
        <Text key={i} variant="body-s" className="text-fg-muted">
          • {it}
        </Text>
      ))}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <Text variant="body-s">
      <span className="text-fg-muted">{label}: </span>
      {value}
    </Text>
  );
}

function Analytics() {
  const q = trpc.adaptation.analytics.useQuery();
  if (q.isLoading) return <PageLoading />;
  return q.data ? (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {q.data.metrics.map((m) => (
          <div key={m.key} className="border-border bg-elevated rounded border px-4 py-2">
            <Text variant="body-s" className="text-fg-muted">
              {m.label}{" "}
              <span
                className={
                  m.trend === "up" ? "text-success" : m.trend === "down" ? "text-warning" : ""
                }
              >
                ({m.trend})
              </span>
            </Text>
            <Text variant="heading-s">
              {m.value}
              {m.unit}
            </Text>
          </div>
        ))}
      </div>
      {q.data.decisions.length > 0 ? (
        <Card className="flex flex-col gap-2 p-4">
          <Text variant="body-m">Decision tendencies</Text>
          {q.data.decisions.map((d) => (
            <div key={d.subject} className="flex items-center justify-between">
              <Text variant="body-s">{d.subject.replace(/_/g, " ")}</Text>
              <Badge variant={d.tendency > 0 ? "success" : d.tendency < 0 ? "warning" : "neutral"}>
                {d.tendency > 0 ? "accepts" : d.tendency < 0 ? "rejects" : "mixed"} ({d.samples})
              </Badge>
            </div>
          ))}
        </Card>
      ) : null}
    </div>
  ) : (
    <Empty
      icon={BarChart3}
      title="No analytics yet"
      text="Behavioural metrics and decision tendencies appear here as activity accrues."
    />
  );
}

const MODES = ["manual", "suggested", "automatic"] as const;
type Mode = (typeof MODES)[number];
const MODE_LABEL: Record<Mode, string> = {
  manual: "Manual",
  suggested: "Suggested",
  automatic: "Automatic",
};
const SENSITIVE = ["health", "communication", "decision_style"];

/** Segmented learning-mode picker; "automatic" is disabled for sensitive categories. */
function ModePicker({
  value,
  category,
  disabled,
  onChange,
}: {
  value: Mode;
  category: string;
  disabled: boolean;
  onChange: (mode: Mode) => void;
}) {
  const sensitive = SENSITIVE.includes(category);
  return (
    <div
      role="radiogroup"
      aria-label={`Learning mode for ${category}`}
      className="border-border flex gap-0.5 rounded-md border p-0.5"
    >
      {MODES.map((m) => {
        const blocked = m === "automatic" && sensitive;
        const active = value === m;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled || blocked}
            title={blocked ? "Sensitive areas can't be automatic" : undefined}
            onClick={() => onChange(m)}
            className={cn(
              "text-caption rounded px-2 py-1",
              active ? "bg-accent text-on-accent" : "text-fg-muted hover:bg-elevated",
              blocked && "cursor-not-allowed opacity-40 hover:bg-transparent",
            )}
          >
            {MODE_LABEL[m]}
          </button>
        );
      })}
    </div>
  );
}

function Settings() {
  const q = trpc.adaptation.settings.useQuery();
  const setPolicy = trpc.adaptation.setPolicy.useMutation();
  const utils = trpc.useUtils();
  if (q.isLoading) return <PageLoading />;
  return (
    <Card className="flex flex-col gap-3 p-5">
      <Text variant="heading-s">Learning policies</Text>
      <Text variant="body-s" className="text-fg-muted">
        Choose how each area learns. Sensitive areas (health, communication, decision style) can
        only be suggested — never automatic. Everything the OS learns is deterministic and
        reversible.
      </Text>
      <div className="divide-border flex flex-col divide-y">
        {q.data?.policies.map((p) => (
          <div key={p.category} className="flex items-center justify-between gap-2 py-2">
            <Text variant="body-m" className="capitalize">
              {p.category.replace("_", " ")}
              {SENSITIVE.includes(p.category) ? (
                <span className="text-fg-muted"> · sensitive</span>
              ) : null}
            </Text>
            <ModePicker
              value={p.mode as Mode}
              category={p.category}
              disabled={setPolicy.isPending}
              onChange={(mode) =>
                setPolicy.mutate(
                  { category: p.category, mode },
                  { onSuccess: () => void utils.adaptation.settings.invalidate() },
                )
              }
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
