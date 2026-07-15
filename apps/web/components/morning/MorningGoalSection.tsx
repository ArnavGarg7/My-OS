"use client";

import { Flame, Flag, Target } from "lucide-react";
import { Progress, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * Morning Briefing goal slot (Sprint 2.12). Editorial, read-only: today's goals,
 * overall goal progress, best habit streak and the next milestone. Derived
 * server-side via the goal portfolio.
 */
export function MorningGoalSection() {
  const portfolio = trpc.goal.portfolio.useQuery();
  const p = portfolio.data;
  if (!p || p.activeCount === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        No active goals yet — set one to give your work direction.
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Target size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="body-m">
          {p.activeCount} active {p.activeCount === 1 ? "goal" : "goals"} · {p.overallProgress}%
          overall
          {p.behindCount > 0 ? ` · ${p.behindCount} behind` : ""}
        </Text>
      </div>
      <Progress value={p.overallProgress} />

      {p.habitStreak > 0 && (
        <div className="flex items-center gap-2">
          <Flame size={15} aria-hidden className="text-warning" />
          <Text variant="body-s">{p.habitStreak}-day habit streak</Text>
        </div>
      )}

      {p.nextMilestone && (
        <div className="flex items-center gap-2">
          <Flag size={15} aria-hidden className="text-fg-subtle" />
          <Text variant="body-s" tone="subtle">
            Next: {p.nextMilestone.title}
            {p.nextMilestone.dueInDays >= 0 ? ` · in ${p.nextMilestone.dueInDays}d` : ""}
          </Text>
        </div>
      )}
    </div>
  );
}
