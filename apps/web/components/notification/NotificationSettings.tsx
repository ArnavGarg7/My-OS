"use client";

import { Text } from "@myos/ui";
import { NOTIFICATION_TYPES, type NotificationPreferences } from "@myos/core/notification";
import { TYPE_LABEL } from "./notification-icons";
import type { UseNotification } from "./use-notification";

/**
 * NotificationSettings (Sprint 3.3). Per-category channel matrix — desktop / push /
 * banner / persistent / sound. Reuses the Platform delivery channels; the engine only
 * decides, the Platform layer delivers.
 */
const CHANNELS = ["desktop", "push", "banner", "persistent", "sound"] as const;

export function NotificationSettings({
  preferences,
  onUpdate,
}: {
  preferences: NotificationPreferences;
  onUpdate: UseNotification["updatePreference"];
}) {
  return (
    <div className="flex flex-col gap-2">
      <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
        Channels
      </Text>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-fg-subtle text-xs">
              <th className="py-1 pr-2 font-medium">Category</th>
              {CHANNELS.map((ch) => (
                <th key={ch} className="px-1 py-1 font-medium capitalize">
                  {ch}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NOTIFICATION_TYPES.map((type) => {
              const cat = preferences.categories.find((c) => c.type === type);
              return (
                <tr key={type} className="border-border border-t">
                  <td className="text-fg-muted py-1.5 pr-2">{TYPE_LABEL[type]}</td>
                  {CHANNELS.map((ch) => (
                    <td key={ch} className="px-1 py-1.5">
                      <input
                        type="checkbox"
                        checked={Boolean(cat?.[ch])}
                        onChange={(e) => onUpdate({ category: { type, [ch]: e.target.checked } })}
                        aria-label={`${TYPE_LABEL[type]} ${ch}`}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
