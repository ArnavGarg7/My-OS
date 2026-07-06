"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { trpc } from "@/lib/trpc/client";

/**
 * Push registration (Sprint 1.7). Abstracts the Web Push subscription lifecycle
 * and stores the subscription server-side (device registration). No server-side
 * push sender exists yet. Consumed via `usePush()`.
 */
export interface PushValue {
  supported: boolean;
  /** VAPID public key present — subscription is possible. */
  configured: boolean;
  isSubscribed: boolean;
  endpoint: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_MYOS_VAPID_PUBLIC_KEY ?? "";

const PushContext = createContext<PushValue | null>(null);

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function bufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function PushProvider({ children }: { children: ReactNode }) {
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const register = trpc.push.register.useMutation();
  const unregister = trpc.push.unregister.useMutation();

  useEffect(() => {
    if (!pushSupported()) return;
    setSupported(true);
    void navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setEndpoint(subscription?.endpoint ?? null))
      .catch(() => setEndpoint(null));
  }, []);

  const value = useMemo<PushValue>(
    () => ({
      supported,
      configured: Boolean(VAPID_PUBLIC_KEY),
      isSubscribed: endpoint !== null,
      endpoint,
      subscribe: async () => {
        if (!pushSupported() || !VAPID_PUBLIC_KEY) return false;
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
          await register.mutateAsync({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: bufferToBase64(subscription.getKey("p256dh")),
              auth: bufferToBase64(subscription.getKey("auth")),
            },
            userAgent: navigator.userAgent,
          });
          setEndpoint(subscription.endpoint);
          return true;
        } catch {
          return false;
        }
      },
      unsubscribe: async () => {
        if (!pushSupported()) return false;
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (!subscription) {
            setEndpoint(null);
            return true;
          }
          const removed = subscription.endpoint;
          await subscription.unsubscribe();
          await unregister.mutateAsync({ endpoint: removed });
          setEndpoint(null);
          return true;
        } catch {
          return false;
        }
      },
    }),
    [supported, endpoint, register, unregister],
  );

  return <PushContext.Provider value={value}>{children}</PushContext.Provider>;
}

export function usePush(): PushValue {
  const ctx = useContext(PushContext);
  if (!ctx) throw new Error("usePush must be used within <PlatformProvider>");
  return ctx;
}
