import { completeOnboarding, updatePreferences, updateProfile } from "../identity";
import {
  onboardingSchema,
  preferencesUpdateSchema,
  profileUpdateSchema,
} from "../identity/schemas";
import { protectedProcedure, publicProcedure, router } from "../trpc";

/**
 * Identity + personalization API (Sprint 1.5). All logic lives in the
 * IdentityService; this router is a thin, validated tRPC surface.
 *  - `current` is public (returns null when signed out) so the client
 *    IdentityProvider can render without throwing.
 *  - mutations are protected.
 */
export const meRouter = router({
  current: publicProcedure.query(({ ctx }) => ctx.getIdentity()),

  updateProfile: protectedProcedure
    .input(profileUpdateSchema)
    .mutation(({ input }) => updateProfile(input)),

  updatePreferences: protectedProcedure
    .input(preferencesUpdateSchema)
    .mutation(({ input }) => updatePreferences(input)),

  completeOnboarding: protectedProcedure
    .input(onboardingSchema)
    .mutation(({ input }) => completeOnboarding(input)),
});
