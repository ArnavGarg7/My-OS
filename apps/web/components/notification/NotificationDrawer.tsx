"use client";

import { Drawer, DrawerContent, DrawerTitle } from "@myos/ui";
import { useNotification } from "./use-notification";
import { NotificationList } from "./NotificationList";

/**
 * NotificationDrawer (Sprint 3.3). A slide-over quick view of active notifications,
 * openable from anywhere (e.g. the top-bar bell). Reuses the design-system Drawer.
 */
export function NotificationDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const n = useNotification();
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right">
        <DrawerTitle>Notifications</DrawerTitle>
        <div className="mt-3 flex flex-col gap-3">
          <NotificationList
            notifications={n.notifications}
            onComplete={n.complete}
            onDismiss={n.dismiss}
            onSnooze={(id) => n.snooze(id, "30m")}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
