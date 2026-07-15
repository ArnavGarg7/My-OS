"use client";

import { RefreshCw } from "lucide-react";
import { Button, Text } from "@myos/ui";
import type { useCalendar } from "./use-calendar";
import { PROVIDER_LABEL } from "./calendar-icons";

/**
 * Calendar sync settings (Sprint 2.7). Trigger a manual sync per provider. Real
 * OAuth uses the existing Identity/Platform infra; webhook sync arrives later.
 */
export function CalendarSyncSettings({ cal }: { cal: ReturnType<typeof useCalendar> }) {
  return (
    <div className="flex flex-col gap-3 pt-2">
      <Text variant="body-s" tone="subtle">
        Sync pulls events from a provider and merges them deterministically.
      </Text>
      <div className="flex flex-col gap-2">
        {cal.availableProviders
          .filter((p) => p !== "local")
          .map((provider) => (
            <div key={provider} className="flex items-center justify-between gap-2">
              <span className="text-body-s text-fg-muted">{PROVIDER_LABEL[provider]}</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => cal.sync(provider)}
                loading={cal.pending}
                leftIcon={<RefreshCw size={13} aria-hidden />}
              >
                Sync
              </Button>
            </div>
          ))}
      </div>
    </div>
  );
}
