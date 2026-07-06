"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCapabilities } from "./providers/platform";

/**
 * Optional device/background capabilities (Sprint 1.7). Everything is feature
 * detected and degrades gracefully — hooks return `supported: false` and no-op
 * when the API is missing. Infrastructure only; no scheduling logic.
 */

interface SyncManagerLike {
  register: (tag: string) => Promise<void>;
}
interface PeriodicSyncManagerLike {
  register: (tag: string, options: { minInterval: number }) => Promise<void>;
}
interface WakeLockSentinelLike {
  release: () => Promise<void>;
  addEventListener?: (type: "release", listener: () => void) => void;
}
interface WakeLockLike {
  request: (type: "screen") => Promise<WakeLockSentinelLike>;
}
interface BatteryManagerLike extends EventTarget {
  level: number;
  charging: boolean;
}

export interface BackgroundSync {
  supported: boolean;
  periodicSupported: boolean;
  requestSync: (tag: string) => Promise<boolean>;
  requestPeriodicSync: (tag: string, minIntervalMs: number) => Promise<boolean>;
}

export function useBackgroundSync(): BackgroundSync {
  const caps = useCapabilities();
  return {
    supported: caps.backgroundSync,
    periodicSupported: caps.periodicSync,
    requestSync: async (tag) => {
      if (!caps.backgroundSync) return false;
      try {
        const registration = await navigator.serviceWorker.ready;
        const sync = (registration as unknown as { sync?: SyncManagerLike }).sync;
        if (!sync) return false;
        await sync.register(tag);
        return true;
      } catch {
        return false;
      }
    },
    requestPeriodicSync: async (tag, minIntervalMs) => {
      if (!caps.periodicSync) return false;
      try {
        const status = await navigator.permissions.query({
          name: "periodic-background-sync" as PermissionName,
        });
        if (status.state !== "granted") return false;
        const registration = await navigator.serviceWorker.ready;
        const periodic = (registration as unknown as { periodicSync?: PeriodicSyncManagerLike })
          .periodicSync;
        if (!periodic) return false;
        await periodic.register(tag, { minInterval: minIntervalMs });
        return true;
      } catch {
        return false;
      }
    },
  };
}

export interface WakeLock {
  supported: boolean;
  active: boolean;
  request: () => Promise<boolean>;
  release: () => Promise<void>;
}

export function useWakeLock(): WakeLock {
  const caps = useCapabilities();
  const [active, setActive] = useState(false);
  const sentinel = useRef<WakeLockSentinelLike | null>(null);

  const request = useCallback(async () => {
    if (!caps.wakeLock) return false;
    try {
      const wakeLock = (navigator as unknown as { wakeLock: WakeLockLike }).wakeLock;
      const lock = await wakeLock.request("screen");
      sentinel.current = lock;
      setActive(true);
      lock.addEventListener?.("release", () => setActive(false));
      return true;
    } catch {
      return false;
    }
  }, [caps.wakeLock]);

  const release = useCallback(async () => {
    try {
      await sentinel.current?.release();
    } catch {
      // ignore
    }
    sentinel.current = null;
    setActive(false);
  }, []);

  return { supported: caps.wakeLock, active, request, release };
}

export interface BatteryStatus {
  supported: boolean;
  level: number | null;
  charging: boolean | null;
}

export function useBattery(): BatteryStatus {
  const caps = useCapabilities();
  const [state, setState] = useState<{ level: number | null; charging: boolean | null }>({
    level: null,
    charging: null,
  });

  useEffect(() => {
    if (!caps.battery) return;
    let battery: BatteryManagerLike | null = null;
    let cancelled = false;
    const getBattery = (navigator as unknown as { getBattery: () => Promise<BatteryManagerLike> })
      .getBattery;

    const update = () => {
      if (battery) setState({ level: battery.level, charging: battery.charging });
    };
    void getBattery.call(navigator).then((b) => {
      if (cancelled) return;
      battery = b;
      update();
      b.addEventListener("levelchange", update);
      b.addEventListener("chargingchange", update);
    });

    return () => {
      cancelled = true;
      battery?.removeEventListener("levelchange", update);
      battery?.removeEventListener("chargingchange", update);
    };
  }, [caps.battery]);

  return { supported: caps.battery, ...state };
}
