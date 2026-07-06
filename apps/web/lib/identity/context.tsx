"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { trpc } from "@/lib/trpc/client";
import type { Identity } from "@/server/identity/types";

/**
 * Client identity context (Sprint 1.5). The rest of the app reads "who is signed
 * in" through `useIdentity()` — never through Clerk hooks. `signOut` is injected
 * by the active auth backend bridge, keeping this provider backend-agnostic.
 */
export interface IdentityContextValue {
  identity: Identity | null;
  isLoading: boolean;
  signOut: () => void | Promise<void>;
  refresh: () => void;
}

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({
  children,
  signOut,
}: {
  children: ReactNode;
  signOut: () => void | Promise<void>;
}) {
  const { data, isLoading, refetch } = trpc.me.current.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });

  const value = useMemo<IdentityContextValue>(
    () => ({
      identity: data ?? null,
      isLoading,
      signOut,
      refresh: () => void refetch(),
    }),
    [data, isLoading, refetch, signOut],
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity(): IdentityContextValue {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentity must be used within the identity provider");
  return ctx;
}
