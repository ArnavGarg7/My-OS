import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/server/identity";
import { AppShell } from "@/components/shell/app-shell";

/**
 * Shared layout for every shell route (Sprint 1.3). As of Sprint 1.5 it is the
 * route-protection + onboarding gate: unauthenticated users are redirected to
 * sign-in (via requireUser), and users who haven't finished onboarding are sent
 * there first. Forced dynamic because it depends on per-request identity.
 */
export const dynamic = "force-dynamic";

export default async function ShellLayout({ children }: { children: ReactNode }) {
  const identity = await requireUser();
  if (!identity.isOnboarded) redirect("/onboarding");
  return <AppShell>{children}</AppShell>;
}
