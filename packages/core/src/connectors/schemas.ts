/**
 * Connector zod schemas (Sprint 6.4). Validate the connect/sync/disconnect inputs + the raw payload
 * shape crossing the server boundary. Pure — no IO. Credentials never appear here.
 */
import { z } from "zod";

export const connectSchema = z.object({
  providerId: z.string(),
  label: z.string().optional(),
  /** The credential the user supplies (encrypted server-side; never returned or sent to AI). */
  secret: z.string().optional(),
});

export const disconnectSchema = z.object({ accountId: z.string() });

export const syncInputSchema = z.object({
  accountId: z.string(),
  trigger: z.enum(["webhook", "polling", "manual"]).default("manual"),
});

export const rawPayloadSchema = z.object({
  type: z.string(),
  externalId: z.string(),
  at: z.string(),
  fields: z.record(z.unknown()).default({}),
});
