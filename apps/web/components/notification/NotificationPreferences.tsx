"use client";

import { Switch, Text } from "@myos/ui";
import { NOTIFICATION_TYPES, type NotificationPreferences as Prefs } from "@myos/core/notification";
import { TYPE_ICON, TYPE_LABEL } from "./notification-icons";
import type { UseNotification } from "./use-notification";

/**
 * NotificationPreferences (Sprint 3.3). Global toggles (mute, quiet hours, weekend
 * suppression) + per-category enable. Deterministic; each toggle persists via the
 * engine's preferences. Channel-level toggles live in NotificationSettings.
 */
export function NotificationPreferences({
  preferences,
  onUpdate,
}: {
  preferences: Prefs;
  onUpdate: UseNotification["updatePreference"];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
          Global
        </Text>
        <ToggleRow
          label="Do not disturb"
          hint="Mute everything except critical."
          checked={preferences.muted}
          onChange={(v) => onUpdate({ muted: v })}
        />
        <ToggleRow
          label="Quiet hours"
          hint={`${preferences.quietHours.start}–${preferences.quietHours.end}`}
          checked={preferences.quietHours.enabled}
          onChange={(v) =>
            onUpdate({
              quietHours: { ...preferences.quietHours, enabled: v },
            })
          }
        />
        <ToggleRow
          label="Weekend suppression"
          hint="Hold non-critical notifications on weekends."
          checked={preferences.weekendSuppression}
          onChange={(v) => onUpdate({ weekendSuppression: v })}
        />
        <ToggleRow
          label="Working hours only"
          hint="Deliver only during your working hours."
          checked={preferences.workingHoursOnly}
          onChange={(v) => onUpdate({ workingHoursOnly: v })}
        />
      </div>

      <div className="flex flex-col gap-3">
        <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
          Categories
        </Text>
        {NOTIFICATION_TYPES.map((type) => {
          const cat = preferences.categories.find((c) => c.type === type);
          const Icon = TYPE_ICON[type];
          return (
            <label key={type} className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2">
                <Icon size={14} aria-hidden className="text-fg-subtle" />
                <Text variant="body-s">{TYPE_LABEL[type]}</Text>
              </span>
              <Switch
                checked={cat?.enabled ?? true}
                onCheckedChange={(v) => onUpdate({ category: { type, enabled: v } })}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="flex flex-col">
        <Text variant="body-s">{label}</Text>
        <Text variant="caption" tone="subtle">
          {hint}
        </Text>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
