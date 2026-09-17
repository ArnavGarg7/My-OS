"use client";

import { composeProviders } from "@/lib/framework";
import { ConnectionProvider } from "./providers/connection";
import { PlatformInfoProvider } from "./providers/platform";
import { InstallProvider } from "./providers/install";
import { UpdatesProvider } from "./providers/updates";
import { NotificationsProvider } from "./providers/notifications";
import { PushProvider } from "./providers/push";
import { NativeProvider } from "./providers/native";

/**
 * The Platform integration provider (Sprint 1.7; native shell added in Stage D).
 * Composes every browser/OS capability behind one wrapper so the app consumes
 * them via hooks (useConnection / usePlatform / useInstall / useUpdates /
 * useNotifications / usePush / useNative). Mount inside the data layer (needs
 * tRPC for push registration). NativeProvider is a no-op outside the Capacitor shell.
 */
export const PlatformProvider = composeProviders([
  PlatformInfoProvider,
  ConnectionProvider,
  InstallProvider,
  UpdatesProvider,
  NotificationsProvider,
  PushProvider,
  NativeProvider,
]);
