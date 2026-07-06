/**
 * Service worker helpers (Sprint 1.7). Thin wrappers over the SW registration
 * API used by the UpdatesProvider. Registration is deferred until the app is
 * idle so it never blocks startup.
 */
export const SERVICE_WORKER_URL = "/sw.js";

export function isServiceWorkerSupported(): boolean {
  return typeof navigator !== "undefined" && "serviceWorker" in navigator;
}

/** Run a callback once the browser is idle (falls back to a short timeout). */
export function whenIdle(callback: () => void): void {
  if (typeof window === "undefined") return;
  const ric = (
    window as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    }
  ).requestIdleCallback;
  if (ric) ric(callback, { timeout: 3000 });
  else window.setTimeout(callback, 1500);
}

export function registerServiceWorker(
  url: string = SERVICE_WORKER_URL,
): Promise<ServiceWorkerRegistration | null> {
  if (!isServiceWorkerSupported()) return Promise.resolve(null);
  return navigator.serviceWorker.register(url, { scope: "/" }).catch(() => null);
}

/** Ask the waiting worker to activate immediately (part of the update flow). */
export function activateWaitingWorker(registration: ServiceWorkerRegistration): void {
  registration.waiting?.postMessage({ type: "SKIP_WAITING" });
}

/** Query the active worker's version via a MessageChannel round-trip. */
export function getServiceWorkerVersion(
  registration: ServiceWorkerRegistration,
): Promise<string | null> {
  const worker = registration.active;
  if (!worker) return Promise.resolve(null);
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timeout = setTimeout(() => resolve(null), 1000);
    channel.port1.onmessage = (event) => {
      clearTimeout(timeout);
      resolve((event.data && event.data.version) ?? null);
    };
    worker.postMessage({ type: "GET_VERSION" }, [channel.port2]);
  });
}
