import { z } from "zod";
import { ACCOUNT_TYPES, BILLING_CYCLES, TRANSACTION_DIRECTIONS } from "./constants";

/**
 * Finance input validation (Sprint 2.11). Shared by tRPC + the service. All
 * entry is manual (no bank sync); single currency for this sprint.
 */
const isoSchema = z.string().datetime();
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createAccountSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(ACCOUNT_TYPES),
  openingBalance: z.number().default(0),
  institution: z.string().trim().max(120).default(""),
  currency: z.string().trim().length(3).optional(),
});

export const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number(),
  category: z.string().trim().max(60).default("other"),
  direction: z.enum(TRANSACTION_DIRECTIONS).default("expense"),
  merchant: z.string().trim().max(120).default(""),
  description: z.string().trim().max(500).default(""),
  occurredAt: isoSchema.optional(),
  projectId: z.string().uuid().nullable().default(null),
});

export const transactionActionSchema = z.object({ id: z.string().uuid() });

export const transferSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().positive(),
});

export const createBudgetSchema = z.object({
  category: z.string().trim().min(1).max(60),
  monthlyLimit: z.number().positive(),
  warningThreshold: z.number().min(0).max(1).default(0.8),
});

export const createSubscriptionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  amount: z.number().positive(),
  billingCycle: z.enum(BILLING_CYCLES),
  nextPayment: dateSchema,
});

export const createSavingsGoalSchema = z.object({
  title: z.string().trim().min(1).max(120),
  targetAmount: z.number().positive(),
  currentAmount: z.number().min(0).default(0),
  deadline: dateSchema.nullable().default(null),
});

export const contributeSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive(),
});

export const searchSchema = z.object({ query: z.string().trim().max(200) });

export const recordSchema = z.object({
  accountId: z.string().uuid(),
  amount: z.number().positive(),
  category: z.string().trim().max(60).optional(),
  merchant: z.string().trim().max(120).optional(),
  description: z.string().trim().max(500).optional(),
  occurredAt: isoSchema.optional(),
});

export const rangeSchema = z.object({ date: dateSchema.optional() });

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type CreateTransactionInputSchema = z.infer<typeof createTransactionSchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>;
