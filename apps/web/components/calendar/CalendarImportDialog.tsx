"use client";

import { useState } from "react";
import { Button, Textarea } from "@myos/ui";

/** ICS import dialog body (Sprint 2.7). Paste an ICS document to import events. */
export function CalendarImportDialog({
  onImport,
  close,
  pending,
}: {
  onImport: (ics: string) => void;
  close: () => void;
  pending: boolean;
}) {
  const [ics, setIcs] = useState("");
  return (
    <div className="flex flex-col gap-3 pt-2">
      <Textarea
        value={ics}
        onChange={(e) => setIcs(e.target.value)}
        placeholder="Paste ICS (BEGIN:VCALENDAR…)"
        rows={6}
        aria-label="ICS content"
      />
      <div className="flex justify-end">
        <Button
          disabled={!ics.trim() || pending}
          loading={pending}
          onClick={() => {
            onImport(ics.trim());
            close();
          }}
        >
          Import events
        </Button>
      </div>
    </div>
  );
}
