import {
  appointmentInputSchema,
  bodyInputSchema,
  completeHabitSchema,
  completeRoutineSchema,
  habitInputSchema,
  injuryInputSchema,
  logMedicationSchema,
  medicationInputSchema,
  reviewInputSchema,
  routineInputSchema,
  supplementInputSchema,
  updateAppointmentSchema,
  updateHabitSchema,
  updateInjurySchema,
  visionInputSchema,
  workoutInputSchema,
  type BodyMeasurement,
  type DoctorAppointment,
  type Habit,
  type Injury,
  type Medication,
  type Supplement,
  type WorkoutSession,
} from "@myos/core/life";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";
import * as summaryService from "./summary";
import * as portfolioService from "./portfolio";
import * as statisticsService from "./statistics";
import { signals as lifeSignalsQuery } from "./signals";
import { routineBlocks } from "./planner";

/**
 * Life API (Sprint 4.2). A zod-validated tRPC surface over the deterministic Personal
 * Life Platform. protectedProcedure only. Every derived view recomputes from stored
 * entities — nothing derived is persisted.
 */
export const lifeRouter = router({
  // Habits
  listHabits: protectedProcedure.query(({ ctx }) => service.listHabits(ctx.db)),
  createHabit: protectedProcedure
    .input(habitInputSchema)
    .mutation(({ ctx, input }) =>
      service.createHabit(ctx.db, input as Parameters<typeof service.createHabit>[1]),
    ),
  updateHabit: protectedProcedure.input(updateHabitSchema).mutation(({ ctx, input }) => {
    const { id, ...patch } = input;
    return service.updateHabit(ctx.db, id, patch as Partial<Habit>);
  }),
  completeHabit: protectedProcedure
    .input(completeHabitSchema)
    .mutation(({ ctx, input }) => service.completeHabit(ctx.db, input.id, input.date)),

  // Routines
  listRoutines: protectedProcedure.query(({ ctx }) => service.listRoutines(ctx.db)),
  createRoutine: protectedProcedure
    .input(routineInputSchema)
    .mutation(({ ctx, input }) =>
      service.createRoutine(ctx.db, input as Parameters<typeof service.createRoutine>[1]),
    ),
  completeRoutine: protectedProcedure
    .input(completeRoutineSchema)
    .mutation(({ ctx, input }) =>
      service.completeRoutine(ctx.db, input.id, input.completedSteps, input.date),
    ),
  routineBlocks: protectedProcedure.query(({ ctx }) => routineBlocks(ctx.db)),

  // Medications / Supplements
  listMedications: protectedProcedure.query(({ ctx }) => service.listMedications(ctx.db)),
  createMedication: protectedProcedure
    .input(medicationInputSchema)
    .mutation(({ ctx, input }) =>
      service.createMedication(ctx.db, input as Partial<Medication> & { name: string }),
    ),
  logMedication: protectedProcedure
    .input(logMedicationSchema)
    .mutation(({ ctx, input }) => service.logMedication(ctx.db, input.id)),
  listSupplements: protectedProcedure.query(({ ctx }) => service.listSupplements(ctx.db)),
  createSupplement: protectedProcedure
    .input(supplementInputSchema)
    .mutation(({ ctx, input }) =>
      service.createSupplement(ctx.db, input as Partial<Supplement> & { name: string }),
    ),

  // Appointments / Injuries
  listAppointments: protectedProcedure.query(({ ctx }) => service.listAppointments(ctx.db)),
  createAppointment: protectedProcedure
    .input(appointmentInputSchema)
    .mutation(({ ctx, input }) =>
      service.createAppointment(
        ctx.db,
        input as Partial<DoctorAppointment> & { title: string; date: string },
      ),
    ),
  updateAppointment: protectedProcedure
    .input(updateAppointmentSchema)
    .mutation(({ ctx, input }) => {
      const { id, ...patch } = input;
      return service.updateAppointment(ctx.db, id, patch as Partial<DoctorAppointment>);
    }),
  listInjuries: protectedProcedure.query(({ ctx }) => service.listInjuries(ctx.db)),
  createInjury: protectedProcedure
    .input(injuryInputSchema)
    .mutation(({ ctx, input }) =>
      service.createInjury(ctx.db, input as Partial<Injury> & { name: string }),
    ),
  updateInjury: protectedProcedure.input(updateInjurySchema).mutation(({ ctx, input }) => {
    const { id, ...patch } = input;
    return service.updateInjury(ctx.db, id, patch as Partial<Injury>);
  }),

  // Workouts / Body
  listWorkouts: protectedProcedure.query(({ ctx }) => service.listWorkouts(ctx.db)),
  logWorkout: protectedProcedure
    .input(workoutInputSchema)
    .mutation(({ ctx, input }) => service.logWorkout(ctx.db, input as Partial<WorkoutSession>)),
  listBody: protectedProcedure.query(({ ctx }) => service.listBody(ctx.db)),
  logBody: protectedProcedure
    .input(bodyInputSchema)
    .mutation(({ ctx, input }) => service.logBody(ctx.db, input as Partial<BodyMeasurement>)),

  // Reviews / Vision (Personal Growth)
  listReviews: protectedProcedure.query(({ ctx }) => service.listReviews(ctx.db)),
  createReview: protectedProcedure.input(reviewInputSchema).mutation(({ ctx, input }) =>
    service.createReview(ctx.db, {
      frequency: input.frequency,
      wins: input.wins ?? [],
      lessons: input.lessons ?? [],
      focusNext: input.focusNext ?? [],
      notes: input.notes ?? "",
      knowledgeNoteId: input.knowledgeNoteId ?? null,
    }),
  ),
  listVision: protectedProcedure.query(({ ctx }) => service.listVision(ctx.db)),
  createVision: protectedProcedure.input(visionInputSchema).mutation(({ ctx, input }) =>
    service.createVision(ctx.db, {
      category: input.category,
      statement: input.statement,
      isIdentity: input.isIdentity ?? false,
      knowledgeNoteId: input.knowledgeNoteId ?? null,
    }),
  ),

  // Derived views
  readiness: protectedProcedure.query(({ ctx }) => summaryService.readiness(ctx.db)),
  habitStreaks: protectedProcedure.query(({ ctx }) => summaryService.habitStreaks(ctx.db)),
  summary: protectedProcedure.query(({ ctx }) => summaryService.summary(ctx.db)),
  portfolio: protectedProcedure.query(({ ctx }) => portfolioService.portfolio(ctx.db)),
  statistics: protectedProcedure.query(({ ctx }) => statisticsService.statistics(ctx.db)),
  correlations: protectedProcedure.query(({ ctx }) => statisticsService.correlations(ctx.db)),
  signals: protectedProcedure.query(({ ctx }) => lifeSignalsQuery(ctx.db)),
});
