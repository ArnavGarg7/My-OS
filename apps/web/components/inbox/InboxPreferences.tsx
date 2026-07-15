"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Text,
} from "@myos/ui";
import { CAPTURE_TYPES, DEFAULT_AUTO_ARCHIVE_DAYS, type CaptureType } from "@myos/core/inbox";
import { captureLabel } from "./inbox-icons";

/**
 * Inbox preferences (Sprint 2.4). Infrastructure only — persisted locally for
 * now; capture/duplicate behaviour reads these later. No backend wiring yet.
 */
const STORAGE_KEY = "myos-inbox-prefs";

interface InboxPrefs {
  duplicateDetection: boolean;
  captureConfirmation: boolean;
  defaultCaptureType: CaptureType;
  autoArchiveDays: number;
}

const DEFAULTS: InboxPrefs = {
  duplicateDetection: true,
  captureConfirmation: false,
  defaultCaptureType: "text",
  autoArchiveDays: DEFAULT_AUTO_ARCHIVE_DAYS,
};

const ARCHIVE_OPTIONS = [7, 14, 30, 60, 90];

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Text variant="body-s">{label}</Text>
        {description ? (
          <Text variant="caption" tone="subtle">
            {description}
          </Text>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function InboxPreferences() {
  const [prefs, setPrefs] = useState<InboxPrefs>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* ignore malformed */
    }
  }, []);

  const update = <K extends keyof InboxPrefs>(key: K, value: InboxPrefs[K]) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <Card padding="lg" className="flex flex-col gap-3">
      <CardHeader className="p-0">
        <CardTitle>Inbox</CardTitle>
        <CardDescription>Capture defaults — behaviour wiring arrives later.</CardDescription>
      </CardHeader>

      <Row label="Duplicate detection" description="Flag possible duplicates on capture.">
        <Switch
          checked={prefs.duplicateDetection}
          onCheckedChange={(v) => update("duplicateDetection", v)}
          aria-label="Duplicate detection"
        />
      </Row>

      <Row label="Capture confirmation" description="Ask before saving each capture.">
        <Switch
          checked={prefs.captureConfirmation}
          onCheckedChange={(v) => update("captureConfirmation", v)}
          aria-label="Capture confirmation"
        />
      </Row>

      <Row label="Default capture type">
        <div className="w-40">
          <Label className="sr-only">Default capture type</Label>
          <Select
            value={prefs.defaultCaptureType}
            onValueChange={(v) => update("defaultCaptureType", v as CaptureType)}
          >
            <SelectTrigger aria-label="Default capture type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CAPTURE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {captureLabel(t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Row>

      <Row label="Auto-archive after" description="Days before untouched items are archived.">
        <div className="w-32">
          <Select
            value={String(prefs.autoArchiveDays)}
            onValueChange={(v) => update("autoArchiveDays", Number(v))}
          >
            <SelectTrigger aria-label="Auto-archive days">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ARCHIVE_OPTIONS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d} days
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Row>
    </Card>
  );
}
