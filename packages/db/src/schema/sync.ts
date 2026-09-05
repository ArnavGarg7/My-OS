/**
 * Offline sync ledger (Stage 8). The ONE place idempotency lives: every offline mutation
 * carries a client-generated `client_mutation_id`; when the outbox replays it, the server
 * records the result here keyed by that id. A replay of the same id returns the stored
 * result instead of re-executing — so a queued create can be retried freely without ever
 * duplicating a task/inbox item/journal entry. Reuses the existing per-domain services;
 * adds no second task/inbox/focus model.
 */
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const syncMutations = pgTable("sync_mutations", {
  /** Client-generated idempotency key (the outbox entry's clientMutationId). */
  clientMutationId: text("client_mutation_id").primaryKey(),
  op: text("op").notNull(),
  status: text("status").notNull().default("succeeded"),
  /** The op's result (e.g. the created entity), so a replay reconciles to the same server row. */
  result: jsonb("result"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SyncMutationRow = typeof syncMutations.$inferSelect;
