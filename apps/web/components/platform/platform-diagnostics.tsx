"use client";

import type { ReactNode } from "react";
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle } from "@myos/ui";
import { useToaster } from "@/lib/framework";
import {
  useBackgroundSync,
  useConnection,
  useInstall,
  useNotifications,
  usePlatform,
  usePush,
  useUpdates,
} from "@/lib/platform";

/**
 * Platform diagnostics (Sprint 1.7) — the Settings › Platform section. Read-only
 * status plus the few safe actions (install, enable notifications, register
 * push, check for updates). All values come from the platform providers.
 */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-body-s text-fg-subtle">{label}</span>
      <span className="text-body-s text-fg flex items-center gap-2 text-right">{children}</span>
    </div>
  );
}

export function PlatformDiagnostics() {
  const platform = usePlatform();
  const connection = useConnection();
  const install = useInstall();
  const updates = useUpdates();
  const notifications = useNotifications();
  const push = usePush();
  const backgroundSync = useBackgroundSync();
  const toaster = useToaster();

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <CardHeader className="p-0">
        <CardTitle>Platform</CardTitle>
        <CardDescription>Installation, offline, notifications and updates.</CardDescription>
      </CardHeader>

      <div className="divide-border divide-y">
        <Row label="Install status">
          {install.isInstalled ? (
            <Badge variant="success">Installed</Badge>
          ) : install.canInstall ? (
            <Button size="sm" variant="secondary" onClick={() => void install.promptInstall()}>
              Install My OS
            </Button>
          ) : (
            <span className="text-fg-subtle">Not available</span>
          )}
        </Row>

        <Row label="Connection">
          <Badge variant={connection.online ? "success" : "danger"}>
            {connection.online ? "Online" : "Offline"}
          </Badge>
          {connection.effectiveType ? (
            <span className="text-fg-subtle">{connection.effectiveType}</span>
          ) : null}
        </Row>

        <Row label="Notification permission">
          <span className="capitalize">{notifications.permission}</span>
          {notifications.permission === "default" ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                const result = await notifications.request();
                if (result === "granted") toaster.success("Notifications enabled");
                else if (result === "denied") toaster.warning("Notifications blocked");
              }}
            >
              Enable
            </Button>
          ) : null}
        </Row>

        <Row label="Push registration">
          {!push.supported ? (
            <span className="text-fg-subtle">Unsupported</span>
          ) : !push.configured ? (
            <span className="text-fg-subtle">Not configured</span>
          ) : push.isSubscribed ? (
            <Button size="sm" variant="ghost" onClick={() => void push.unsubscribe()}>
              Unregister
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                const ok = await push.subscribe();
                toaster[ok ? "success" : "error"](
                  ok ? "Device registered" : "Couldn’t register device",
                );
              }}
            >
              Register
            </Button>
          )}
        </Row>

        <Row label="Background sync">
          <span className="text-fg-subtle">
            {backgroundSync.supported ? "Supported" : "Unsupported"}
          </span>
        </Row>

        <Row label="Offline mode">
          <span className="text-fg-subtle">
            {platform.capabilities.serviceWorker ? "Service worker active" : "Unsupported"}
          </span>
        </Row>

        <Row label="Current version">v{platform.appVersion}</Row>
        <Row label="Service worker version">{updates.serviceWorkerVersion ?? "—"}</Row>
        <Row label="Display mode">
          <span className="capitalize">{platform.displayMode.replace(/-/g, " ")}</span>
        </Row>
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            await updates.checkForUpdates();
            toaster.info(updates.updateAvailable ? "Update available" : "You're up to date");
          }}
        >
          Check for updates
        </Button>
      </div>
    </Card>
  );
}
