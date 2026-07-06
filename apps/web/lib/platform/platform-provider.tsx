"use client";

import { composeProviders } from "@/lib/framework";
import { ConnectionProvider } from "./providers/connection";
import { PlatformInfoProvider } from "./providers/platform";
import { InstallProvider } from "./providers/install";
import { UpdatesProvider } from "./providers/updates";
import { NotificationsProvider } from "./providers/notifications";
import { PushProvider } from "./providers/push";

/**
 * The Platform integration provider (Sprint 1.7). Composes every browser/OS
 * capability behind one wrapper so the app consumes them via hooks
 * (useConnection / usePlatform / useInstall / useUpdates / useNotifications /
 * usePush). Mount inside the data layer (needs tRPC for push registration).
 */
export const PlatformProvider = composeProviders([
  PlatformInfoProvider,
  ConnectionProvider,
  InstallProvider,
  UpdatesProvider,
  NotificationsProvider,
  PushProvider,
]);
