"use client";

import { useMemo, useState } from "react";
import type { Habit } from "@myos/core/life";
import { useToaster } from "@/lib/framework";
import { trpc } from "@/lib/trpc/client";
import { useOptionalTimeline } from "@/lib/timeline";
import { useOptionalAnalytics } from "@/lib/analytics";

/**
 * Life Platform controller (Sprint 4.2). Owns every life query + mutation — habits,
 * routines, medications, supplements, appointments, injuries, workouts, body, reviews,
 * vision — and emits timeline + analytics events. Deterministic; reflects engine state.
 */
export function useLife() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const timeline = useOptionalTimeline();
  const analytics = useOptionalAnalytics();

  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const habits = trpc.life.listHabits.useQuery();
  const routines = trpc.life.listRoutines.useQuery();
  const medications = trpc.life.listMedications.useQuery();
  const supplements = trpc.life.listSupplements.useQuery();
  const appointments = trpc.life.listAppointments.useQuery();
  const injuries = trpc.life.listInjuries.useQuery();
  const workouts = trpc.life.listWorkouts.useQuery();
  const body = trpc.life.listBody.useQuery();
  const reviews = trpc.life.listReviews.useQuery();
  const vision = trpc.life.listVision.useQuery();
  const streaks = trpc.life.habitStreaks.useQuery();
  const readiness = trpc.life.readiness.useQuery();
  const summary = trpc.life.summary.useQuery(undefined, { refetchInterval: 60_000 });
  const portfolio = trpc.life.portfolio.useQuery();
  const statistics = trpc.life.statistics.useQuery();
  const correlations = trpc.life.correlations.useQuery();

  const refresh = () => utils.life.invalidate();

  const completeHabit = trpc.life.completeHabit.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Habit completed");
      timeline.emit({ kind: "life_habit.completed", source: "life", title: "Habit completed" });
      analytics.track({ kind: "life.habit_consistency", value: 1 });
    },
  });
  const createHabit = trpc.life.createHabit.useMutation({ onSuccess: refresh });
  const createRoutine = trpc.life.createRoutine.useMutation({ onSuccess: refresh });
  const completeRoutine = trpc.life.completeRoutine.useMutation({
    onSuccess: () => {
      refresh();
      timeline.emit({ kind: "routine.completed", source: "life", title: "Routine completed" });
    },
  });
  const createMedication = trpc.life.createMedication.useMutation({ onSuccess: refresh });
  const logMedication = trpc.life.logMedication.useMutation({
    onSuccess: () => {
      refresh();
      timeline.emit({ kind: "medication.logged", source: "life", title: "Medication logged" });
    },
  });
  const createSupplement = trpc.life.createSupplement.useMutation({ onSuccess: refresh });
  const createAppointment = trpc.life.createAppointment.useMutation({ onSuccess: refresh });
  const completeAppointment = trpc.life.updateAppointment.useMutation({
    onSuccess: () => {
      refresh();
      timeline.emit({
        kind: "appointment.completed",
        source: "life",
        title: "Appointment completed",
      });
    },
  });
  const createInjury = trpc.life.createInjury.useMutation({
    onSuccess: () => {
      refresh();
      timeline.emit({ kind: "injury.logged", source: "life", title: "Injury logged" });
    },
  });
  const logWorkout = trpc.life.logWorkout.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Workout logged");
      timeline.emit({ kind: "workout.completed", source: "life", title: "Workout logged" });
      analytics.track({ kind: "life.workout_load", value: 1 });
    },
  });
  const logBody = trpc.life.logBody.useMutation({ onSuccess: refresh });
  const createReview = trpc.life.createReview.useMutation({
    onSuccess: () => {
      refresh();
      timeline.emit({
        kind: "personal_review.completed",
        source: "life",
        title: "Review completed",
      });
    },
  });
  const createVision = trpc.life.createVision.useMutation({ onSuccess: refresh });

  const allHabits = useMemo(() => (habits.data ?? []) as Habit[], [habits.data]);
  const selectedHabit = useMemo(
    () => allHabits.find((h) => h.id === selectedHabitId) ?? null,
    [allHabits, selectedHabitId],
  );

  return {
    habits: allHabits,
    streaks: streaks.data ?? [],
    routines: routines.data ?? [],
    medications: medications.data ?? [],
    supplements: supplements.data ?? [],
    appointments: appointments.data ?? [],
    injuries: injuries.data ?? [],
    workouts: workouts.data ?? [],
    body: body.data ?? [],
    reviews: reviews.data ?? [],
    vision: vision.data ?? [],
    readiness: readiness.data ?? null,
    summary: summary.data ?? null,
    portfolio: portfolio.data ?? null,
    statistics: statistics.data ?? null,
    correlations: correlations.data ?? [],
    isLoading: habits.isLoading,

    selectedHabit,
    selectedHabitId,
    setSelectedHabitId,

    completeHabit: (id: string) => completeHabit.mutate({ id }),
    createHabit: (input: {
      name: string;
      frequency?: "daily" | "weekly" | "monthly" | "custom";
      target?: number;
    }) => createHabit.mutate(input),
    createRoutine: (input: {
      name: string;
      steps?: { title: string; durationMinutes?: number }[];
    }) => createRoutine.mutate(input),
    completeRoutine: (id: string) => completeRoutine.mutate({ id }),
    createMedication: (input: { name: string; dosage?: string }) => createMedication.mutate(input),
    logMedication: (id: string) => logMedication.mutate({ id }),
    createSupplement: (input: { name: string; dosage?: string }) => createSupplement.mutate(input),
    createAppointment: (input: { title: string; date: string; provider?: string }) =>
      createAppointment.mutate(input),
    completeAppointment: (id: string) => completeAppointment.mutate({ id, completed: true }),
    createInjury: (input: { name: string; bodyPart?: string; severity?: number }) =>
      createInjury.mutate(input),
    logWorkout: (input: { perceivedExertion?: number; recoveryNotes?: string }) =>
      logWorkout.mutate(input),
    logBody: (input: { weightKg?: number; restingHeartRate?: number }) => logBody.mutate(input),
    createReview: (input: { frequency: "weekly" | "monthly" | "quarterly" | "annual" }) =>
      createReview.mutate(input),
    createVision: (input: {
      category:
        | "health"
        | "career"
        | "relationships"
        | "finance"
        | "learning"
        | "personal"
        | "spiritual"
        | "recreation";
      statement: string;
      isIdentity?: boolean;
    }) => createVision.mutate(input),
    pending: createHabit.isPending || completeHabit.isPending,
  };
}

export type UseLife = ReturnType<typeof useLife>;
