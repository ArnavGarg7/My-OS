"use client";

import { Gauge } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import type { HealthSummary } from "@myos/core/health";
import { readinessTone } from "./health-icons";
import type { useHealthController } from "./use-health";
import { SleepCard } from "./SleepCard";
import { RecoveryCard } from "./RecoveryCard";
import { WaterCard } from "./WaterCard";
import { NutritionCard } from "./NutritionCard";
import { WorkoutCard } from "./WorkoutCard";
import { EnergyCard } from "./EnergyCard";
import { BodyMetricsCard } from "./BodyMetricsCard";
import { HealthGoals } from "./HealthGoals";

const BADGE: Record<"success" | "warning" | "danger", "success" | "warning" | "danger"> = {
  success: "success",
  warning: "warning",
  danger: "danger",
};

/** Readiness hero + the grid of wellness cards (Sprint 2.9). */
export function HealthDashboard({
  summary,
  controller,
}: {
  summary: HealthSummary;
  controller: ReturnType<typeof useHealthController>;
}) {
  const tone = readinessTone(summary.readiness.score);

  return (
    <div className="flex flex-col gap-4">
      <section className="border-border flex items-center gap-4 rounded-lg border p-5">
        <Gauge size={40} aria-hidden className="text-accent shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Text variant="display-m" className="tabular-nums">
              {summary.readiness.score}
            </Text>
            <Badge size="sm" variant={BADGE[tone]}>
              {summary.readiness.band.replace("_", " ")}
            </Badge>
          </div>
          <Text variant="body-s" tone="subtle">
            Readiness · {summary.readiness.recommendation}
          </Text>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SleepCard sleep={summary.sleep} />
        <RecoveryCard recovery={summary.recovery} />
        <EnergyCard energy={summary.energy} onSet={controller.setEnergy} />
        <WaterCard hydration={summary.hydration} onLog={(ml) => controller.logWater(ml)} />
        <NutritionCard nutrition={summary.nutrition} />
        <WorkoutCard workouts={summary.workouts} />
        <BodyMetricsCard measurements={controller.body} />
        <HealthGoals summary={summary} />
      </div>
    </div>
  );
}
