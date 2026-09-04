import { redirect } from "next/navigation";
import { requireUser } from "@/server/identity";
import { DEFAULT_LANDING_PAGE } from "@/lib/identity/options";
import { OnboardingForm } from "@/components/identity/onboarding-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Welcome" };

/**
 * First-login gate. Protected (requireUser redirects unauthenticated visitors to
 * sign-in); sends already-onboarded users on to their landing page.
 */
export default async function OnboardingPage() {
  const identity = await requireUser();
  if (identity.isOnboarded) redirect(identity.preferences.defaultLandingPage);

  // A brand-new user lands on the operational home. If they later pick a
  // different landing page in Preferences, the already-onboarded redirect above
  // respects that choice.
  return (
    <main className="bg-base flex min-h-dvh items-center justify-center p-4">
      <OnboardingForm
        defaultName={identity.preferences.displayName ?? ""}
        defaultTimezone={identity.preferences.timezone}
        landingPage={DEFAULT_LANDING_PAGE}
      />
    </main>
  );
}
