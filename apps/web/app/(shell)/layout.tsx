import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/identity";
import { AppShell } from "@/components/shell/app-shell";

/**
 * Shared layout for every shell route (Sprint 1.3). As of Sprint 1.5 it is the
 * route-protection + onboarding gate: unauthenticated users are redirected to
 * sign-in (via requireUser), and users who haven't finished onboarding are sent
 * there first. Forced dynamic because it depends on per-request identity.
 *
 * The shell (all of it a Client Component tree) is wrapped in an explicit
 * <Suspense> so React's `useId` measures tree ids from a boundary that exists
 * identically on the server and during client hydration. Without it, the async
 * `await requireUser()` above makes the server render the client subtree behind
 * an implicit boundary the client doesn't reconstruct, which shifted every Radix
 * `useId` and produced an app-wide hydration mismatch (Stage A / A1.1).
 */
export const dynamic = "force-dynamic";

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const identity = await requireUser();
  if (!identity.isOnboarded) redirect("/onboarding");
  return (
    <Suspense>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
