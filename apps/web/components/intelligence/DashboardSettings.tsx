"use client";

import { Badge, Button, Text } from "@myos/ui";
import type { DashboardPreferences, DashboardWidget } from "@myos/core/intelligence";

/**
 * DashboardSettings (Sprint 4.4). Reorder + show/hide widgets. Widget state stores LAYOUT ONLY
 * — it is isolated from all business data, so tweaking the dashboard never touches a metric.
 */
export function DashboardSettings({
  preferences,
  onSave,
}: {
  preferences: DashboardPreferences | undefined;
  onSave: (input: { widgetOrder: DashboardWidget[]; hiddenWidgets?: DashboardWidget[] }) => void;
}) {
  if (!preferences) return null;

  const move = (widget: DashboardWidget, delta: number) => {
    const order = [...preferences.widgetOrder];
    const i = order.indexOf(widget);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j]!, order[i]!];
    onSave({ widgetOrder: order, hiddenWidgets: preferences.hiddenWidgets });
  };

  const toggle = (widget: DashboardWidget) => {
    const hidden = preferences.hiddenWidgets.includes(widget)
      ? preferences.hiddenWidgets.filter((w) => w !== widget)
      : [...preferences.hiddenWidgets, widget];
    onSave({ widgetOrder: preferences.widgetOrder, hiddenWidgets: hidden });
  };

  return (
    <div className="flex flex-col gap-1">
      <Text variant="caption" tone="subtle">
        REORDER + SHOW/HIDE WIDGETS
      </Text>
      {preferences.widgetOrder.map((w) => {
        const hidden = preferences.hiddenWidgets.includes(w);
        return (
          <div
            key={w}
            className="border-border-subtle flex items-center justify-between rounded-md border px-3 py-1.5"
          >
            <span className="inline-flex items-center gap-2">
              <Text variant="body-s">{w}</Text>
              {hidden ? (
                <Badge size="sm" variant="neutral">
                  Hidden
                </Badge>
              ) : null}
            </span>
            <span className="inline-flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Move ${w} up`}
                onClick={() => move(w, -1)}
              >
                ↑
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Move ${w} down`}
                onClick={() => move(w, 1)}
              >
                ↓
              </Button>
              <Button size="sm" variant="ghost" onClick={() => toggle(w)}>
                {hidden ? "Show" : "Hide"}
              </Button>
            </span>
          </div>
        );
      })}
    </div>
  );
}
