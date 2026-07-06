import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ConnectionProvider, useConnection } from "./connection";
import { InstallProvider, useInstall } from "./install";
import { NotificationsProvider, useNotifications } from "./notifications";
import { UpdatesProvider, useUpdates } from "./updates";

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", { value, configurable: true });
}

describe("ConnectionProvider", () => {
  afterEach(() => setOnline(true));

  it("reflects navigator.onLine and reacts to offline/online events", () => {
    setOnline(true);
    const { result } = renderHook(() => useConnection(), { wrapper: ConnectionProvider });
    expect(result.current.online).toBe(true);

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.offline).toBe(true);
    expect(result.current.status).toBe("offline");

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current.online).toBe(true);
  });
});

describe("NotificationsProvider", () => {
  it("reports unsupported when the Notification API is absent (jsdom)", () => {
    const { result } = renderHook(() => useNotifications(), { wrapper: NotificationsProvider });
    expect(result.current.supported).toBe(false);
    expect(result.current.permission).toBe("unsupported");
    expect(result.current.isGranted).toBe(false);
  });
});

describe("UpdatesProvider", () => {
  it("is unsupported without a service worker (jsdom)", () => {
    const { result } = renderHook(() => useUpdates(), { wrapper: UpdatesProvider });
    expect(result.current.status).toBe("unsupported");
    expect(result.current.updateAvailable).toBe(false);
  });
});

describe("InstallProvider", () => {
  it("is unavailable without a beforeinstallprompt event", () => {
    const { result } = renderHook(() => useInstall(), { wrapper: InstallProvider });
    expect(result.current.state).toBe("unavailable");
    expect(result.current.canInstall).toBe(false);
    expect(result.current.isInstalled).toBe(false);
  });
});
