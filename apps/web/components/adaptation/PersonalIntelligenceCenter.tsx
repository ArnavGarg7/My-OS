"use client";

import { useState } from "react";
import { Badge, Button, Card, Tabs, TabsContent, TabsList, TabsTrigger, Text } from "@myos/ui";
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

function ConfidenceBadge({ level, caption }: { level: string; caption?: string }) {
  return <Badge variant={CONF[level] ?? "neutral"}>{caption ?? level.replace("_", " ")}</Badge>;
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

function Empty({ text }: { text: string }) {
  return (
    <Card className="p-6">
      <Text variant="body-m" className="text-fg-muted">
        {text}
      </Text>
    </Card>
  );
}

function Profile() {
  const q = trpc.adaptation.profile.useQuery();
  if (q.isLoading) return <PageLoading />;
  const cats = q.data ? Object.entries(q.data.byCategory) : [];
  return q.data ? (
    <div className="flex flex-col gap-3">
      <Card className="flex items-center justify-between p-4">
        <div>
          <Text variant="heading-s">Profile maturity</Text>
          <Text variant="body-s" className="text-fg-muted">
            {q.data.fieldCount} learned field{q.data.fieldCount === 1 ? "" : "s"} across{" "}
            {cats.length} categories.
          </Text>
        </div>
        <Text variant="heading-m">{Math.round(q.data.maturity * 100)}%</Text>
      </Card>
      {cats.length === 0 ? (
        <Empty text="Nothing learned yet. As you use the OS, confident preferences appear here with their evidence." />
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
    <Empty text="No profile yet." />
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
    <Empty text="No preferences learned yet." />
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
    <Empty text="No habit models yet — they form once enough completion history exists." />
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
    <Empty text="No routines discovered yet — they require repeated evidence." />
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
    <Empty text="No insights yet — they appear once the OS is confident enough to explain a pattern." />
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
        <Empty text="No review data yet." />
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
    <Empty text="No analytics yet." />
  );
}

const MODES = ["manual", "suggested", "automatic"] as const;
const SENSITIVE = ["health", "communication", "decision_style"];

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
            <select
              className="border-border bg-base rounded border p-1 text-sm"
              value={p.mode}
              onChange={(e) =>
                setPolicy.mutate(
                  { category: p.category, mode: e.target.value as (typeof MODES)[number] },
                  { onSuccess: () => void utils.adaptation.settings.invalidate() },
                )
              }
            >
              {MODES.map((m) => (
                <option
                  key={m}
                  value={m}
                  disabled={m === "automatic" && SENSITIVE.includes(p.category)}
                >
                  {m}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </Card>
  );
}

const pct = (n: number) => `${Math.round(n * 100)}%`;
