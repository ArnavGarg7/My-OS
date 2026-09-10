import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";

/**
 * Secure Vault router (Stage C, Tier 2). Owner-only. Every field is opaque ciphertext/base64 — the
 * server validates shape and size, stores/returns it, and never decrypts. No search, no AI here.
 */
const ct = z.string().max(200_000); // base64 ciphertext blob
const keyMaterial = z.object({
  kdfSalt: z.string().max(1000),
  wrappedDek: z.string().max(2000),
  verifier: z.string().max(2000),
  recoverySalt: z.string().max(1000).nullable(),
  recoveryWrappedDek: z.string().max(2000).nullable(),
});

export const vaultRouter = router({
  status: protectedProcedure.query(({ ctx }) => service.status(ctx.db)),
  recovery: protectedProcedure.query(({ ctx }) => service.recovery(ctx.db)),
  setup: protectedProcedure
    .input(keyMaterial)
    .mutation(({ ctx, input }) => service.setup(ctx.db, input)),
  rewrap: protectedProcedure
    .input(keyMaterial)
    .mutation(({ ctx, input }) => service.rewrap(ctx.db, input)),
  notes: protectedProcedure.query(({ ctx }) => service.notes(ctx.db)),
  createNote: protectedProcedure
    .input(z.object({ titleCiphertext: ct, bodyCiphertext: ct }))
    .mutation(({ ctx, input }) =>
      service.createNote(ctx.db, input.titleCiphertext, input.bodyCiphertext),
    ),
  updateNote: protectedProcedure
    .input(z.object({ id: z.string().uuid(), titleCiphertext: ct, bodyCiphertext: ct }))
    .mutation(({ ctx, input }) =>
      service.updateNote(ctx.db, input.id, input.titleCiphertext, input.bodyCiphertext),
    ),
  deleteNote: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => service.removeNote(ctx.db, input.id)),
});
