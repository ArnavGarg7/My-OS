"use client";

import Link from "next/link";
import { Droplet, Salad } from "lucide-react";
import { Card, MonoLabel, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { todayDateIso } from "./use-nutrition";

/**
 * Nutrition in Today (Part C). A compact macro + water summary vs goal for today, linking to /nutrition.
 * Renders nothing until something is logged, so Today stays clean for non-users.
 */
function Bar({ value, target, tone }: { value: number; target: number; tone: string }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  return (
    <div className="bg-surface-2 h-1.5 w-full overflow-hidden rounded-full">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(2, pct)}%`, background: tone }}
      />
    </div>
  );
}

export function NutritionTodayPanel() {
  const q = trpc.nutrition.day.useQuery({ date: todayDateIso() }, { staleTime: 120_000 });
  const d = q.data;
  if (!d || (d.logs.length === 0 && d.waterMl === 0)) return null;

  return (
    <Link href="/nutrition" className="block no-underline">
      <Card variant="insight" padding="md" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Salad size={15} aria-hidden className="text-accent" />
            <MonoLabel tone="subtle">Nutrition today</MonoLabel>
          </div>
          <Text variant="body-s" className="tabular-nums">
            {d.consumed.calories}
            <span className="text-fg-subtle"> / {d.goals.calorieTarget} kcal</span>
          </Text>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Text variant="caption" tone="subtle">
              Protein {Math.round(d.consumed.protein)}g
            </Text>
            <Bar value={d.consumed.protein} target={d.goals.proteinTarget} tone="#3fb27f" />
          </div>
          <div className="space-y-1">
            <Text variant="caption" tone="subtle">
              Carbs {Math.round(d.consumed.carbs)}g
            </Text>
            <Bar value={d.consumed.carbs} target={d.goals.carbsTarget} tone="#d9a441" />
          </div>
          <div className="space-y-1">
            <Text variant="caption" tone="subtle">
              Fat {Math.round(d.consumed.fat)}g
            </Text>
            <Bar value={d.consumed.fat} target={d.goals.fatTarget} tone="#c0507a" />
          </div>
        </div>
        <div className="text-fg-subtle flex items-center gap-1.5">
          <Droplet size={12} aria-hidden className="text-[#3f93b8]" />
          <Text variant="caption" tone="subtle" className="tabular-nums">
            {d.waterMl} / {d.waterTarget} ml water
          </Text>
        </div>
      </Card>
    </Link>
  );
}
