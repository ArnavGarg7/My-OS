"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { APP_VERSION } from "@myos/shared/constants";
import {
  activateWaitingWorker,
  getServiceWorkerVersion,
  isServiceWorkerSupported,
  registerServiceWorker,
  whenIdle,
} from "../service-worker";
import type { ServiceWorkerStatus } from "../types";

/**
 * Service-worker lifecycle + update detection (Sprint 1.7). Registers the SW
 * after the app is idle, surfaces a waiting worker as an available update, and
 * applies it via the skip-waiting flow. Consumed via `useUpdates()`.
 */
export interface UpdatesValue {
  status: ServiceWorkerStatus;
  updateAvailable: boolean;
  appVersion: string;
  serviceWorkerVersion: string | null;
  applyUpdate: () => void;
  dismissUpdate: () => void;
  checkForUpdates: () => Promise<void>;
}

const UpdatesContext = createContext<UpdatesValue | null>(null);

export function UpdatesProvider({ children }: { children: ReactNode }) {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const applyingRef = useRef(false);
  const [status, setStatus] = useState<ServiceWorkerStatus>(() =>
    isServiceWorkerSupported() ? "unregistered" : "unsupported",
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [serviceWorkerVersion, setServiceWorkerVersion] = useState<string | null>(null);

  useEffect(() => {
    if (!isServiceWorkerSupported()) return;
    let cancelled = false;

    const markWaiting = () => {
      setUpdateAvailable(true);
      setStatus("waiting");
      setDismissed(false);
    };

    const watchInstalling = (registration: ServiceWorkerRegistration) => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          markWaiting();
        }
      });
    };

    whenIdle(async () => {
      setStatus("registering");
      const registration = await registerServiceWorker();
      if (cancelled) return;
      if (!registration) {
        setStatus("error");
        return;
      }
      registrationRef.current = registration;
      setStatus("registered");
      void getServiceWorkerVersion(registration).then((version) => {
        if (!cancelled) setServiceWorkerVersion(version);
      });
      if (registration.waiting && navigator.serviceWorker.controller) markWaiting();
      registration.addEventListener("updatefound", () => watchInstalling(registration));
    });

    const onControllerChange = () => {
      if (applyingRef.current) window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const value = useMemo<UpdatesValue>(
    () => ({
      status,
      updateAvailable: updateAvailable && !dismissed,
      appVersion: APP_VERSION,
      serviceWorkerVersion,
      applyUpdate: () => {
        const registration = registrationRef.current;
        if (!registration?.waiting) return;
        applyingRef.current = true;
        activateWaitingWorker(registration);
      },
      dismissUpdate: () => setDismissed(true),
      checkForUpdates: async () => {
        await registrationRef.current?.update();
      },
    }),
    [status, updateAvailable, dismissed, serviceWorkerVersion],
  );

  return <UpdatesContext.Provider value={value}>{children}</UpdatesContext.Provider>;
}

export function useUpdates(): UpdatesValue {
  const ctx = useContext(UpdatesContext);
  if (!ctx) throw new Error("useUpdates must be used within <PlatformProvider>");
  return ctx;
}
