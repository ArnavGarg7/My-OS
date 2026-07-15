"use client";

import { Button, Spinner, Textarea } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/** ICS export dialog body (Sprint 2.7). Shows the exported ICS for copying. */
export function CalendarExportDialog() {
  const exportQuery = trpc.calendar.export.useQuery({});
  const ics = exportQuery.data?.ics ?? "";

  return (
    <div className="flex flex-col gap-3 pt-2">
      {exportQuery.isLoading ? (
        <Spinner size="sm" />
      ) : (
        <>
          <Textarea
            value={ics}
            readOnly
            rows={8}
            aria-label="Exported ICS"
            className="font-mono text-xs"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigator.clipboard?.writeText(ics)}
            >
              Copy to clipboard
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
