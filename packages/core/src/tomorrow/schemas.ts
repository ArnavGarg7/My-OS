import { z } from "zod";
import { STUDIO_STEPS, TOMORROW_STATUSES } from "./constants";

/**
 * Tomorrow Studio zod schemas (Sprint 3.1). Validate the tRPC surface — stepping
 * the workflow, confirming carry-forward, selecting priorities, toggling the
 * checklist and finalising. All deterministic; carry-forward + priorities are
 * explicit user confirmations.
 */
export const studioStepSchema = z.enum(STUDIO_STEPS);
export const tomorrowStatusSchema = z.enum(TOMORROW_STATUSES);

export const getTomorrowSchema = z.object({ date: z.string().optional() });

export const confirmCarryForwardSchema = z.object({
  acceptedIds: z.array(z.string()).max(100),
});

export const selectPrioritiesSchema = z.object({
  priorities: z
    .array(
      z.object({
        title: z.string().min(1).max(300),
        taskId: z.string().uuid().nullish(),
        projectId: z.string().uuid().nullish(),
        goalId: z.string().uuid().nullish(),
      }),
    )
    .max(5),
});

export const toggleChecklistSchema = z.object({
  itemId: z.string().min(1),
  completed: z.boolean(),
});

export const previewSchema = z.object({
  action: z.enum(["accept", "regenerate", "discard"]).optional(),
});

export const finalizeSchema = z.object({
  sleepTargetMinutes: z.number().int().min(0).max(720).optional(),
});
