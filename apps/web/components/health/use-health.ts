"use client";

import { parseLog } from "@myos/core/health";
import type { EnergyLevel, Mood, WorkoutType } from "@myos/core/health";
import { useToaster } from "@/lib/framework";
import { trpc } from "@/lib/trpc/client";
import { useOptionalTimeline } from "@/lib/timeline";
import { useOptionalAnalytics } from "@/lib/analytics";

/**
 * Client health controller (Sprint 2.9). Reads today's summary + logs and
 * exposes the manual log mutations. Every successful log emits Timeline +
 * Analytics events through the Sprint 2.8.5 seams.
 */
export function useHealthController() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const timeline = useOptionalTimeline();
  const analytics = useOptionalAnalytics();

  const summary = trpc.health.summary.useQuery({});
  const hydration = trpc.health.hydration.useQuery({});
  const nutrition = trpc.health.nutrition.useQuery({});
  const workouts = trpc.health.workouts.useQuery({});
  const body = trpc.health.body.useQuery();
  const sleep = trpc.health.sleep.useQuery();

  const refresh = () => {
    utils.health.summary.invalidate();
    utils.health.hydration.invalidate();
    utils.health.nutrition.invalidate();
    utils.health.workouts.invalidate();
    utils.health.body.invalidate();
    utils.health.sleep.invalidate();
  };

  const waterM = trpc.health.logWater.useMutation({
    onSuccess: (log) => {
      refresh();
      toaster.success("Water logged");
      timeline.emit({ kind: "health.logged", source: "health", title: `Water ${log.amountMl}ml` });
    },
    onError: (e) => toaster.error("Couldn't log water", e.message),
  });
  const mealM = trpc.health.logMeal.useMutation({
    onSuccess: (log) => {
      refresh();
      toaster.success("Meal logged");
      timeline.emit({
        kind: "health.logged",
        source: "health",
        title: `${log.meal} · ${log.calories} kcal`,
      });
    },
    onError: (e) => toaster.error("Couldn't log meal", e.message),
  });
  const workoutM = trpc.health.logWorkout.useMutation({
    onSuccess: (w) => {
      refresh();
      toaster.success("Workout logged");
      timeline.emit({
        kind: "health.logged",
        source: "health",
        title: `${w.type} · ${w.durationMinutes}m`,
      });
      analytics.track({ kind: "workout.logged" });
    },
    onError: (e) => toaster.error("Couldn't log workout", e.message),
  });
  const sleepM = trpc.health.logSleep.useMutation({
    onSuccess: (s) => {
      refresh();
      toaster.success("Sleep logged");
      timeline.emit({
        kind: "health.logged",
        source: "health",
        title: `Slept ${s.durationMinutes}m`,
      });
    },
    onError: (e) => toaster.error("Couldn't log sleep", e.message),
  });
  const weightM = trpc.health.updateWeight.useMutation({
    onSuccess: (m) => {
      refresh();
      toaster.success("Weight updated");
      timeline.emit({ kind: "health.logged", source: "health", title: `Weight ${m.weight}kg` });
    },
    onError: (e) => toaster.error("Couldn't update weight", e.message),
  });
  const energyM = trpc.health.updateEnergy.useMutation({ onSuccess: refresh });
  const moodM = trpc.health.updateMood.useMutation({ onSuccess: refresh });

  return {
    summary: summary.data ?? null,
    isLoading: summary.isLoading,
    hydration: hydration.data ?? [],
    nutrition: nutrition.data ?? [],
    workouts: workouts.data ?? [],
    body: body.data ?? [],
    sleep: sleep.data ?? [],
    logWater: (amountMl: number, source: "water" | "coffee" | "tea" | "other" = "water") =>
      waterM.mutate({ amountMl, source }),
    logMeal: (
      meal: "breakfast" | "lunch" | "dinner" | "snack",
      calories: number,
      protein = 0,
      carbs = 0,
      fat = 0,
    ) => mealM.mutate({ meal, calories, protein, carbs, fat }),
    logWorkout: (type: WorkoutType, durationMinutes: number, rpe: number | null = null) =>
      workoutM.mutate({ type, durationMinutes, volume: 0, rpe, completed: true }),
    logSleep: (bedTime: string, wakeTime: string, quality = 70) =>
      sleepM.mutate({ bedTime, wakeTime, quality }),
    updateWeight: (weight: number) => weightM.mutate({ weight }),
    setEnergy: (level: EnergyLevel) => energyM.mutate({ energyLevel: level }),
    setMood: (mood: Mood) => moodM.mutate({ mood }),
    /** Route a natural-language quick-log to the right mutation. */
    quickLog: (text: string): boolean => {
      const parsed = parseLog(text);
      switch (parsed.kind) {
        case "water":
          waterM.mutate({ amountMl: parsed.amountMl, source: parsed.source });
          return true;
        case "workout":
          workoutM.mutate({
            type: parsed.type,
            durationMinutes: parsed.durationMinutes,
            volume: 0,
            rpe: null,
            completed: true,
          });
          return true;
        case "sleep": {
          if (parsed.durationMinutes <= 0) return false;
          const wake = new Date();
          const bed = new Date(wake.getTime() - parsed.durationMinutes * 60_000);
          sleepM.mutate({ bedTime: bed.toISOString(), wakeTime: wake.toISOString(), quality: 70 });
          return true;
        }
        case "meal":
          mealM.mutate({
            meal: parsed.meal,
            calories: parsed.calories,
            protein: 0,
            carbs: 0,
            fat: 0,
          });
          return true;
        case "weight":
          weightM.mutate({ weight: parsed.weight });
          return true;
        default:
          return false;
      }
    },
    pending:
      waterM.isPending ||
      mealM.isPending ||
      workoutM.isPending ||
      sleepM.isPending ||
      weightM.isPending,
  };
}
