import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@myos/ui";
import { APP_NAME, APP_TAGLINE } from "@myos/shared/constants";
import { clerkEnabled, getCurrentUser } from "@/server/identity";

export const dynamic = "force-dynamic";

/**
 * Public landing (Sprint 1.5). Authenticated users are sent to onboarding or
 * their landing page; everyone else sees the entry point. In local dev mode the
 * owner is always present, so this immediately forwards into the OS.
 */
export default async function LandingPage() {
  const identity = await getCurrentUser();
  if (identity) {
    redirect(identity.isOnboarded ? identity.preferences.defaultLandingPage : "/onboarding");
  }

  return (
    <main className="bg-base text-fg flex min-h-dvh flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="max-w-lg space-y-3">
        <p className="text-caption text-fg-subtle uppercase tracking-[0.2em]">{APP_NAME}</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          The Operating System for My Life.
        </h1>
        <p className="text-body-l text-fg-muted">{APP_TAGLINE}</p>
      </div>
      {clerkEnabled() ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/sign-up">Create account</Link>
          </Button>
        </div>
      ) : (
        <Button asChild size="lg">
          <Link href="/today">Enter My OS</Link>
        </Button>
      )}
    </main>
  );
}
