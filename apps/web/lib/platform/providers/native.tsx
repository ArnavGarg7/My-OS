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
import { trpc } from "@/lib/trpc/client";
import { isNativeApp, nativePlatform } from "../native/capacitor";
import { handleAuthReturn } from "../native/native-auth";

/**
 * Native shell integration (Stage D). Activates ONLY inside the Capacitor Android WebView — a complete
 * no-op in a browser or PWA. Two jobs: (1) native chrome on launch (status bar + hide splash + deep-link
 * auth-return listener) and (2) FCM push registration once the user is authenticated — the client half
 * of the "app-closed notification" loop, handing the device's FCM token to `push.registerDevice` so the
 * server-side sender can reach it. All plugins are lazy-imported so web users never load them.
 */
export interface NativeValue {
  isNative: boolean;
  platform: string;
  /** The device's FCM token has been registered with the server this session. */
  pushRegistered: boolean;
}

const NativeContext = createContext<NativeValue | null>(null);

export function NativeProvider({ children }: { children: ReactNode }) {
  const native = isNativeApp();
  // Read identity via tRPC directly (this provider sits ABOVE the identity context), gated to the
  // native app so browser/PWA users add no extra query. `data` is the identity or null.
  const me = trpc.me.current.useQuery(undefined, {
    enabled: native,
    staleTime: 60_000,
    retry: false,
  });
  const authed = Boolean(me.data);
  const registerDevice = trpc.push.registerDevice.useMutation();
  const [pushRegistered, setPushRegistered] = useState(false);
  const pushSetUp = useRef(false);

  // Native chrome + deep-link listener — once, on mount, when running natively.
  useEffect(() => {
    if (!native) return;
    let disposed = false;
    void (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#0c0d0e" });
      } catch {
        // status bar plugin unavailable — ignore
      }
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide();
      } catch {
        // splash plugin unavailable — ignore
      }
      try {
        const { App } = await import("@capacitor/app");
        if (disposed) return;
        await App.addListener("appUrlOpen", (event: { url: string }) => {
          void handleAuthReturn(event.url);
        });
      } catch {
        // app plugin unavailable — ignore
      }
    })();
    return () => {
      disposed = true;
    };
  }, [native]);

  // FCM push registration — after sign-in (registerDevice is a protected mutation), wired once.
  useEffect(() => {
    if (!native || !authed || pushSetUp.current) return;
    pushSetUp.current = true;
    void (async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        await PushNotifications.addListener("registration", (token: { value: string }) => {
          registerDevice.mutate({
            token: token.value,
            platform: "android",
            userAgent: navigator.userAgent,
          });
          setPushRegistered(true);
        });
        await PushNotifications.addListener("registrationError", () => {
          // leave pushRegistered false; a later launch retries
        });
        await PushNotifications.addListener(
          "pushNotificationReceived",
          (_notification: {
            title?: string;
            body?: string;
            id?: string;
            data?: Record<string, unknown>;
          }) => {
            // Foreground notification received; Capacitor presentationOptions display heads-up alert.
          },
        );
        await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action: { notification: { data?: Record<string, unknown> } }) => {
            const href = action.notification.data?.href;
            if (typeof href === "string" && href.startsWith("/")) window.location.assign(href);
          },
        );

        let receive = (await PushNotifications.checkPermissions()).receive;
        if (receive === "prompt" || receive === "prompt-with-rationale") {
          receive = (await PushNotifications.requestPermissions()).receive;
        }
        if (receive === "granted") {
          await PushNotifications.createChannel({
            id: "default",
            name: "General Notifications",
            description: "My OS notifications and reminders",
            importance: 5,
            visibility: 1,
            vibration: true,
          }).catch(() => {});
          await PushNotifications.register();
        } else {
          pushSetUp.current = false;
        }
      } catch {
        pushSetUp.current = false; // allow a retry on the next authenticated render
      }
    })();
  }, [native, authed, registerDevice]);

  const value = useMemo<NativeValue>(
    () => ({ isNative: native, platform: nativePlatform(), pushRegistered }),
    [native, pushRegistered],
  );

  return <NativeContext.Provider value={value}>{children}</NativeContext.Provider>;
}

export function useNative(): NativeValue {
  const ctx = useContext(NativeContext);
  if (!ctx) throw new Error("useNative must be used within <PlatformProvider>");
  return ctx;
}
