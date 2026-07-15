"use client";

import { Check, Flame } from "lucide-react";
import { Button, cn, Text } from "@myos/ui";
import { analyzeHabit, type Habit } from "@myos/core/goal";
import { CYCLE_FREQ_LABEL } from "./habit-labels";

/**
 * HabitCard (Sprint 2.12). One habit with its streak, consistency and a
 * complete-today action. Streaks are derived from the completion history.
 */
export function HabitCard({
  habit,
  onComplete,
}: {
  habit: Habit;
  onComplete?: ((id: string) => void) | undefined;
}) {
  const stats = analyzeHabit(habit, new Date());
  const doneToday = habit.lastCompleted === new Date().toISOString().slice(0, 10);
  return (
    <div className="border-border flex items-center gap-3 rounded-md border p-3">
      <Flame
        size={18}
        aria-hidden
        className={cn(stats.habit.currentStreak > 0 ? "text-warning" : "text-fg-subtle")}
      />
      <div className="min-w-0 flex-1">
        <Text variant="body-s" className="truncate">
          {habit.title}
        </Text>
        <Text variant="caption" tone={stats.atRisk ? "danger" : "subtle"}>
          {CYCLE_FREQ_LABEL[habit.frequency]} · {stats.habit.currentStreak}-day streak ·{" "}
          {stats.consistency}%{stats.atRisk ? " · at risk" : ""}
        </Text>
      </div>
      {onComplete && (
        <Button
          size="sm"
          variant={doneToday ? "secondary" : "primary"}
          disabled={doneToday}
          onClick={() => onComplete(habit.id)}
        >
          <Check size={14} aria-hidden />
          {doneToday ? "Done" : "Log"}
        </Button>
      )}
    </div>
  );
}
