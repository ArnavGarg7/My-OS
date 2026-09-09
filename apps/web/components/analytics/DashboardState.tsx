"use client";

import { Spinner, Text } from "@myos/ui";

/**
 * Shared loading / empty affordance for the analytics sub-dashboards (Stage A / WS2).
 * Each dashboard fetches its own slice on tab-switch; without this they rendered
 * `null` while the query was in flight, so a tab flashed blank. This distinguishes
 * "still loading" from "no data yet" instead of showing nothing.
 */
export function DashboardState({ loading }: { loading: boolean }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 py-8 text-center">
      {loading ? (
        <>
          <Spinner size="sm" />
          <Text variant="body-s" tone="subtle">
            Crunching the numbers…
          </Text>
        </>
      ) : (
        <Text variant="body-s" tone="subtle">
          Not enough data for this view yet.
        </Text>
      )}
    </div>
  );
}
