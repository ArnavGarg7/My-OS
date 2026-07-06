"use client";

import type { ReactNode } from "react";
import { useClerk } from "@clerk/nextjs";
import { IdentityProvider } from "./context";

/**
 * Clerk implementation of the identity bridge. The only client module that calls
 * a Clerk hook. Supplies `signOut` to the backend-agnostic IdentityProvider.
 */
export function ClerkIdentityBridge({ children }: { children: ReactNode }) {
  const { signOut } = useClerk();
  return (
    <IdentityProvider signOut={() => signOut({ redirectUrl: "/" })}>{children}</IdentityProvider>
  );
}
