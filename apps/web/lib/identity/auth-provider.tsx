"use client";

import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkConfigured } from "./config";
import { ClerkIdentityBridge } from "./clerk-bridge";
import { DevIdentityBridge } from "./dev-bridge";

/**
 * Auth wiring for the composition root (Sprint 1.5). Two pieces so the data
 * layer (tRPC/Query) can sit between them:
 *  - {@link AuthShellProvider} — outermost; mounts ClerkProvider when configured.
 *  - {@link IdentityBridge} — innermost; supplies identity + signOut via the
 *    active backend, and must live inside the tRPC/Query providers.
 *
 * This is the only place ClerkProvider is mounted; feature code stays Clerk-free.
 */
export function AuthShellProvider({ children }: { children: ReactNode }) {
  if (clerkConfigured) return <ClerkProvider>{children}</ClerkProvider>;
  return <>{children}</>;
}

export function IdentityBridge({ children }: { children: ReactNode }) {
  return clerkConfigured ? (
    <ClerkIdentityBridge>{children}</ClerkIdentityBridge>
  ) : (
    <DevIdentityBridge>{children}</DevIdentityBridge>
  );
}
