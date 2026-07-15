"use client";

import { BarChart3 } from "lucide-react";
import type { ReportType, ScoreBoard } from "@myos/core/analytics";
import { Text, cn } from "@myos/ui";
import { PageContainer, PageContent, PageLoading } from "@/components/framework";
import { useShellStore } from "@/lib/shell/store";
import { useAnalyticsPage, type AnalyticsSection } from "./use-analytics-page";
import { AnalyticsFilters } from "./AnalyticsFilters";
import { ScoreTile } from "./AnalyticsCharts";
import { ProductivityDashboard } from "./ProductivityDashboard";
import { FocusDashboard } from "./FocusDashboard";
import { PlannerDashboard } from "./PlannerDashboard";
import { CalendarDashboard } from "./CalendarDashboard";
import { ProjectDashboard } from "./ProjectDashboard";
import { GoalDashboard } from "./GoalDashboard";
import { HealthDashboard } from "./HealthDashboard";
import { FinanceDashboard } from "./FinanceDashboard";
import { JournalDashboard } from "./JournalDashboard";
import { AnalyticsTimeline } from "./AnalyticsTimeline";
import { WeeklyReview } from "./WeeklyReview";

const SECTIONS: { key: AnalyticsSection; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "productivity", label: "Productivity" },
  { key: "focus", label: "Focus" },
  { key: "planner", label: "Planner" },
  { key: "calendar", label: "Calendar" },
  { key: "projects", label: "Projects" },
  { key: "goals", label: "Goals" },
  { key: "health", label: "Health" },
  { key: "finance", label: "Finance" },
  { key: "journal", label: "Journal" },
  { key: "timeline", label: "Timeline" },
  { key: "review", label: "Weekly Review" },
];

/**
 * Analytics page (Sprint 2.14). The single deterministic dashboard — a period
 * selector, a section switcher and an editorial view of every domain's metrics,
 * plus the weekly review. Everything derives from existing engines; nothing is
 * duplicated. The final layer of the deterministic OS.
 */
export function AnalyticsPage() {
  const a = useAnalyticsPage();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);

  if (a.isLoading && !a.summary) return <PageLoading label="Crunching your numbers…" />;

  const section = (
    <SectionBody
      sectionKey={a.section}
      period={a.period}
      overallScore={a.summary?.scores.overall ?? 0}
      scores={a.summary?.scores ?? null}
    />
  );

  return (
    <PageContainer width="full" className="p-0">
      <PageContent className="gap-0 p-0">
        <div className="border-border flex flex-col gap-3 border-b p-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} aria-hidden className="text-fg-subtle" />
            <Text variant="heading-s">Analytics</Text>
            <span className="flex-1" />
            <AnalyticsFilters period={a.period} onPeriod={a.setPeriod} />
          </div>
          <div className="flex flex-wrap gap-1">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-pressed={a.section === s.key}
                onClick={() => {
                  a.setSection(s.key);
                  a.selectMetric(s.key);
                  openContextPanel(true);
                }}
                className={cn(
                  "text-caption rounded-full border px-2.5 py-1 transition-colors",
                  a.section === s.key
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-fg-subtle hover:text-fg",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-3xl">{section}</div>
        </div>
      </PageContent>
    </PageContainer>
  );
}

function SectionBody({
  sectionKey,
  period,
  scores,
}: {
  sectionKey: AnalyticsSection;
  period: ReportType;
  overallScore: number;
  scores: ScoreBoard | null;
}) {
  switch (sectionKey) {
    case "productivity":
      return <ProductivityDashboard period={period} />;
    case "focus":
      return <FocusDashboard period={period} />;
    case "planner":
      return <PlannerDashboard />;
    case "calendar":
      return <CalendarDashboard period={period} />;
    case "projects":
      return <ProjectDashboard period={period} />;
    case "goals":
      return <GoalDashboard period={period} />;
    case "health":
      return <HealthDashboard />;
    case "finance":
      return <FinanceDashboard />;
    case "journal":
      return <JournalDashboard period={period} />;
    case "timeline":
      return <AnalyticsTimeline period={period} />;
    case "review":
      return <WeeklyReview />;
    case "overview":
    default:
      return (
        <div className="flex flex-col gap-6">
          {scores ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <ScoreTile label="Overall" score={scores.overall} />
              <ScoreTile label="Productivity" score={scores.productivity} />
              <ScoreTile label="Focus" score={scores.focus} />
              <ScoreTile label="Planner" score={scores.planner} />
              <ScoreTile label="Health" score={scores.health} />
              <ScoreTile label="Goals" score={scores.goals} />
              <ScoreTile label="Finance" score={scores.finance} />
              <ScoreTile label="Journal" score={scores.journal} />
            </div>
          ) : null}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <ProductivityDashboard period={period} />
            <AnalyticsTimeline period={period} />
          </div>
        </div>
      );
  }
}
