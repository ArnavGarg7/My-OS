import { z } from "zod";
import {
  ACTION_KINDS,
  AUTOMATION_PRIORITIES,
  CONDITION_COMBINATORS,
  CONDITION_OPERATORS,
  EXECUTION_POLICIES,
  TIME_CONDITIONS,
  TRIGGER_KINDS,
} from "./constants";

/**
 * Automation zod schemas (Sprint 3.4). Validate the tRPC surface — create/update a
 * rule, execute, preview, enable/disable. Conditions are recursively validated.
 */
export const triggerKindSchema = z.enum(TRIGGER_KINDS);
export const actionKindSchema = z.enum(ACTION_KINDS);
export const executionPolicySchema = z.enum(EXECUTION_POLICIES);
export const automationPrioritySchema = z.enum(AUTOMATION_PRIORITIES);

export const conditionSchema = z.object({
  id: z.string(),
  field: z.string().min(1),
  operator: z.enum(CONDITION_OPERATORS),
  value: z.unknown(),
  timeCondition: z.enum(TIME_CONDITIONS).optional(),
});

export type ConditionGroupInput = {
  combinator: (typeof CONDITION_COMBINATORS)[number];
  conditions: (z.infer<typeof conditionSchema> | ConditionGroupInput)[];
};

export const conditionGroupSchema: z.ZodType<ConditionGroupInput> = z.lazy(() =>
  z.object({
    combinator: z.enum(CONDITION_COMBINATORS),
    conditions: z.array(z.union([conditionSchema, conditionGroupSchema])),
  }),
);

export const actionSchema = z.object({
  id: z.string(),
  kind: actionKindSchema,
  params: z.record(z.unknown()).default({}),
  order: z.number().int().min(0),
});

export const policyConfigSchema = z.object({
  policy: executionPolicySchema,
  cooldownMinutes: z.number().int().min(0).max(10080).optional(),
  throttleMinutes: z.number().int().min(0).max(1440).optional(),
  maxExecutions: z.number().int().min(1).max(1000).optional(),
  retryAttempts: z.number().int().min(1).max(10).optional(),
  retryBackoffMinutes: z.number().int().min(0).max(1440).optional(),
  delayMinutes: z.number().int().min(0).max(1440).optional(),
  scheduleAt: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

export const automationDraftSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  priority: automationPrioritySchema.optional(),
  trigger: z.object({ kind: triggerKindSchema, event: z.string().max(100) }),
  conditions: conditionGroupSchema.optional(),
  actions: z.array(actionSchema).min(1).max(20),
  policy: policyConfigSchema.optional(),
  builtIn: z.boolean().optional(),
});

export const automationIdSchema = z.object({ id: z.string().uuid() });

export const updateAutomationSchema = automationDraftSchema.partial().extend({
  id: z.string().uuid(),
});

export const executeSchema = z.object({
  id: z.string().uuid(),
  /** Optional manual trigger payload. */
  payload: z.record(z.unknown()).optional(),
});

export const previewSchema = z.object({
  id: z.string().uuid().optional(),
  draft: automationDraftSchema.optional(),
  payload: z.record(z.unknown()).optional(),
});

export const historyQuerySchema = z.object({
  ruleId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(200).optional(),
});
