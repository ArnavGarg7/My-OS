/**
 * Autopilot zod schemas (Sprint 6.3). Validate the approve/reject/execute/rollback/policy inputs
 * crossing the server boundary. Pure — no IO.
 */
import { z } from "zod";

export const policySchema = z.enum(["always_ask", "ask_once", "trusted", "disabled"]);

export const proposalActionSchema = z.object({ proposalId: z.string() });

export const setPolicySchema = z.object({
  automationId: z.string(),
  policy: policySchema,
});

export const proposalStateSchema = z.enum([
  "draft",
  "ready",
  "pending_approval",
  "approved",
  "executing",
  "completed",
  "rejected",
  "failed",
  "rolled_back",
]);
