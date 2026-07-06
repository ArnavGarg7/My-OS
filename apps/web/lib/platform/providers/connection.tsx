"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ConnectionStatus } from "../types";

/**
 * Connection state (Sprint 1.7). Wraps navigator.onLine + the online/offline
 * events, plus the Network Information API where available. Consumed via
 * `useConnection()` — features never read navigator directly.
 */
export interface ConnectionValue {
  status: ConnectionStatus;
  online: boolean;
  offline: boolean;
  /** e.g. "4g" | "3g" | "slow-2g" when the Network Information API is present. */
  effectiveType: string | null;
  /** True until the first client-side reading resolves (SSR renders "online"). */
  pending: boolean;
}

const ConnectionContext = createContext<ConnectionValue | null>(null);

type NetworkInformation = {
  effectiveType?: string;
  addEventListener?: typeof addEventListener;
  removeEventListener?: typeof removeEventListener;
};

function getConnection(): NetworkInformation | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { connection?: NetworkInformation }).connection;
}

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);
  const [effectiveType, setEffectiveType] = useState<string | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      setEffectiveType(getConnection()?.effectiveType ?? null);
      setPending(false);
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const conn = getConnection();
    conn?.addEventListener?.("change", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      conn?.removeEventListener?.("change", update);
    };
  }, []);

  const value = useMemo<ConnectionValue>(
    () => ({
      status: online ? "online" : "offline",
      online,
      offline: !online,
      effectiveType,
      pending,
    }),
    [online, effectiveType, pending],
  );

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnection(): ConnectionValue {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error("useConnection must be used within <PlatformProvider>");
  return ctx;
}
