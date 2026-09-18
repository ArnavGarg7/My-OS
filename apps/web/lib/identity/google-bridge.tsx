"use client";

import type { ReactNode } from "react";
import { signOut } from "next-auth/react";
import { isNativeApp } from "@/lib/platform/native/capacitor";
import { IdentityProvider } from "./context";

/**
 * Google (Auth.js) implementation of the identity bridge — the analogue of `clerk-bridge`. The only
 * client module that calls an Auth.js hook. Supplies `signOut` to the backend-agnostic IdentityProvider.
 *
 * In the native app the session is the `myos_mobile_session` cookie (not a NextAuth session), so sign-out
 * must clear THAT cookie via the mobile endpoint, then return to the public landing. Web/PWA uses the
 * normal Auth.js sign-out.
 */
export function GoogleIdentityBridge({ children }: { children: ReactNode }) {
  const doSignOut = async () => {
    if (isNativeApp()) {
      try {
        await fetch("/api/mobile/auth/signout", { method: "POST", credentials: "include" });
      } catch {
        // ignore — still navigate away below
      }
      window.location.assign("/");
      return;
    }
    await signOut({ callbackUrl: "/" });
  };

  return <IdentityProvider signOut={doSignOut}>{children}</IdentityProvider>;
}
