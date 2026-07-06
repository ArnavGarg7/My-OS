"use client";

import type { ReactNode } from "react";
import { IdentityProvider } from "./context";

/**
 * Dev (Clerk-unconfigured) identity bridge. There is no real session to end —
 * the local owner is always present — so `signOut` just returns to the landing.
 */
export function DevIdentityBridge({ children }: { children: ReactNode }) {
  return (
    <IdentityProvider
      signOut={() => {
        window.location.href = "/";
      }}
    >
      {children}
    </IdentityProvider>
  );
}
