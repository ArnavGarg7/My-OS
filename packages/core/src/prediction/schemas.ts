/**
 * Prediction — zod schemas (Sprint 6.2). Validate the scenario-simulation input crossing the server
 * boundary. Pure — no IO.
 */
import { z } from "zod";

export const scenarioKindSchema = z.enum([
  "move_workout",
  "add_focus_block",
  "drop_task",
  "reduce_meetings",
  "extend_deadline",
]);

export const scenarioInputSchema = z.object({
  kind: scenarioKindSchema,
  amount: z.number().optional(),
  /** The prediction id the scenario is simulated against. */
  predictionId: z.string().optional(),
});
export type ScenarioInputSchema = z.infer<typeof scenarioInputSchema>;

export const predictionKindSchema = z.enum([
  "goal",
  "deadline",
  "schedule",
  "workload",
  "study",
  "project",
  "health",
  "habit",
]);
