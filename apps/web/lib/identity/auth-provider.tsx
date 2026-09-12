"use client";

import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { SessionProvider } from "next-auth/react";
import { clerkConfigured, googleAuthConfigured } from "./config";
import { ClerkIdentityBridge } from "./clerk-bridge";
import { GoogleIdentityBridge } from "./google-bridge";
import { DevIdentityBridge } from "./dev-bridge";

/**
 * Auth wiring for the composition root (Sprint 1.5). Two pieces so the data
 * layer (tRPC/Query) can sit between them:
 *  - {@link AuthShellProvider} — outermost; mounts the active backend's context provider
 *    (Clerk's ClerkProvider, or Auth.js's SessionProvider).
 *  - {@link IdentityBridge} — innermost; supplies identity + signOut via the active backend, and must
 *    live inside the tRPC/Query providers.
 *
 * This is the only place a backend SDK provider is mounted; feature code stays backend-free.
 */
export function AuthShellProvider({ children }: { children: ReactNode }) {
  if (clerkConfigured) return <ClerkProvider>{children}</ClerkProvider>;
  if (googleAuthConfigured) return <SessionProvider>{children}</SessionProvider>;
  return <>{children}</>;
}

export function IdentityBridge({ children }: { children: ReactNode }) {
  if (clerkConfigured) return <ClerkIdentityBridge>{children}</ClerkIdentityBridge>;
  if (googleAuthConfigured) return <GoogleIdentityBridge>{children}</GoogleIdentityBridge>;
  return <DevIdentityBridge>{children}</DevIdentityBridge>;
}
