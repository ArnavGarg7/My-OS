import {
  categoryActionSchema,
  contributeSchema,
  createAccountSchema,
  createBudgetSchema,
  createCategorySchema,
  createSavingsGoalSchema,
  createSubscriptionSchema,
  createTransactionSchema,
  recordSchema,
  searchSchema,
  transactionActionSchema,
  transferSchema,
  updateAccountSchema,
  updateCategorySchema,
} from "@myos/core/finance";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";
import * as summaryService from "./summary";
import { forecast } from "./forecasts";

/**
 * Finance API (Sprint 2.11). Thin, zod-validated tRPC surface over
 * FinanceService — the deterministic personal financial OS.
 */
export const financeRouter = router({
  accounts: protectedProcedure.query(({ ctx }) => service.accounts(ctx.db)),
  createAccount: protectedProcedure
    .input(createAccountSchema)
    .mutation(({ ctx, input }) => service.createAccount(ctx.db, input)),
  updateAccount: protectedProcedure
    .input(updateAccountSchema)
    .mutation(({ ctx, input }) => service.updateAccount(ctx.db, input)),

  // Custom categories (Phase 3)
  categories: protectedProcedure.query(({ ctx }) => service.categories(ctx.db)),
  createCategory: protectedProcedure
    .input(createCategorySchema)
    .mutation(({ ctx, input }) => service.createCategory(ctx.db, input)),
  updateCategory: protectedProcedure
    .input(updateCategorySchema)
    .mutation(({ ctx, input }) => service.updateCategory(ctx.db, input)),
  archiveCategory: protectedProcedure
    .input(categoryActionSchema)
    .mutation(({ ctx, input }) => service.updateCategory(ctx.db, { id: input.id, archived: true })),

  transactions: protectedProcedure.query(({ ctx }) => service.transactions(ctx.db)),
  createTransaction: protectedProcedure
    .input(createTransactionSchema)
    .mutation(({ ctx, input }) => service.createTransaction(ctx.db, input)),
  deleteTransaction: protectedProcedure
    .input(transactionActionSchema)
    .mutation(({ ctx, input }) => service.removeTransaction(ctx.db, input.id)),

  recordIncome: protectedProcedure
    .input(recordSchema)
    .mutation(({ ctx, input }) => service.record(ctx.db, "income", input)),
  recordExpense: protectedProcedure
    .input(recordSchema)
    .mutation(({ ctx, input }) => service.record(ctx.db, "expense", input)),
  transfer: protectedProcedure
    .input(transferSchema)
    .mutation(({ ctx, input }) => service.transfer(ctx.db, input)),

  budgets: protectedProcedure.query(({ ctx }) => service.budgets(ctx.db)),
  createBudget: protectedProcedure
    .input(createBudgetSchema)
    .mutation(({ ctx, input }) => service.createBudget(ctx.db, input)),

  subscriptions: protectedProcedure.query(({ ctx }) => service.subscriptions(ctx.db)),
  createSubscription: protectedProcedure
    .input(createSubscriptionSchema)
    .mutation(({ ctx, input }) => service.createSubscription(ctx.db, input)),

  savings: protectedProcedure.query(({ ctx }) => service.savings(ctx.db)),
  createSavingsGoal: protectedProcedure
    .input(createSavingsGoalSchema)
    .mutation(({ ctx, input }) => service.createSavingsGoal(ctx.db, input)),
  contribute: protectedProcedure
    .input(contributeSchema)
    .mutation(({ ctx, input }) => service.contributeSavings(ctx.db, input)),

  forecast: protectedProcedure.query(({ ctx }) => forecast(ctx.db)),
  summary: protectedProcedure.query(({ ctx }) =>
    summaryService.summary(ctx.db, ctx.identity.preferences.timezone),
  ),
  signals: protectedProcedure.query(({ ctx }) =>
    summaryService.signals(ctx.db, ctx.identity.preferences.timezone),
  ),
  counts: protectedProcedure.query(({ ctx }) => summaryService.counts(ctx.db)),
  search: protectedProcedure
    .input(searchSchema)
    .query(({ ctx, input }) => summaryService.search(ctx.db, input.query)),
});
