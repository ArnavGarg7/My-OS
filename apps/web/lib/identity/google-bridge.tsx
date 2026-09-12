"use client";

import type { ReactNode } from "react";
import { signOut } from "next-auth/react";
import { IdentityProvider } from "./context";

/**
 * Google (Auth.js) implementation of the identity bridge — the analogue of `clerk-bridge`. The only
 * client module that calls an Auth.js hook. Supplies `signOut` to the backend-agnostic IdentityProvider.
 */
export function GoogleIdentityBridge({ children }: { children: ReactNode }) {
  return (
    <IdentityProvider signOut={() => signOut({ callbackUrl: "/" })}>{children}</IdentityProvider>
  );
}
