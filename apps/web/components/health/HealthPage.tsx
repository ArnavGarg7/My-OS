"use client";

import { PageContainer, PageContent, PageLoading } from "@/components/framework";
import { SectionHeader, Text } from "@myos/ui";
import { useHealthController } from "./use-health";
import { HealthDashboard } from "./HealthDashboard";
import { HealthQuickLog } from "./HealthQuickLog";
import { HealthQuickLogDialog } from "./HealthQuickLogDialog";
import { HealthTimeline } from "./HealthTimeline";

/**
 * Health page (Sprint 2.9). The personal wellness dashboard: a readiness hero,
 * the wellness card grid, a natural-language quick-log and today's timeline.
 */
export function HealthPage() {
  const controller = useHealthController();

  if (controller.isLoading || !controller.summary) {
    return <PageLoading label="Reading your wellness…" />;
  }

  return (
    <PageContainer width="full" aurora>
      <PageContent stagger className="gap-6">
        <div className="flex flex-col gap-1">
          <Text variant="heading-l">Health</Text>
          <Text variant="body-s" tone="subtle">
            Deterministic wellness — sleep, recovery, readiness, nutrition and hydration.
          </Text>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <HealthQuickLogDialog controller={controller} />
            <Text variant="caption" tone="subtle">
              or type it below
            </Text>
          </div>
          <HealthQuickLog onLog={controller.quickLog} />
        </div>

        <HealthDashboard summary={controller.summary} controller={controller} />

        <section className="flex flex-col gap-2">
          <SectionHeader title="Today's timeline" />
          <HealthTimeline
            hydration={controller.hydration}
            nutrition={controller.nutrition}
            workouts={controller.workouts}
          />
        </section>
      </PageContent>
    </PageContainer>
  );
}
