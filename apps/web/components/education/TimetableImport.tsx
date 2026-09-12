"use client";

import { useRef, useState } from "react";
import { AlertCircle, ImageUp, Loader2, Sparkles } from "lucide-react";
import { Badge, Button, Card, MonoLabel, Text } from "@myos/ui";
import type { ParsedTimetable } from "@myos/core/education";
import { trpc } from "@/lib/trpc/client";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Read a File, downscale to <=maxPx on the long edge, return base64 JPEG (no data: prefix). */
async function fileToResizedJpegBase64(file: File, maxPx = 1600): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error("Could not read the file."));
    fr.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Could not decode the image."));
    i.src = dataUrl;
  });
  const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing is unavailable in this browser.");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1] ?? "";
}

/**
 * Import a weekly timetable from a photo (Education, Part D). Reads + downscales the image in the
 * browser, sends it to the feature-local Gemini vision extractor, shows the parsed classes for review,
 * and commits them on confirm. Reviewing before writing keeps a misread photo from polluting the DB.
 */
export function TimetableImport() {
  const utils = trpc.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);
  const parse = trpc.education.parseTimetableImage.useMutation();
  const importMut = trpc.education.importTimetable.useMutation({
    onSuccess: () => {
      void utils.education.overview.invalidate();
      void utils.education.list.invalidate();
    },
  });

  const [preview, setPreview] = useState<ParsedTimetable | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File) => {
    setBusy(true);
    setError(null);
    setPreview(null);
    try {
      const imageBase64 = await fileToResizedJpegBase64(file);
      const result = await parse.mutateAsync({ imageBase64, mimeType: "image/jpeg" });
      if (result.ok && result.timetable) setPreview(result.timetable);
      else setError(result.error ?? "Couldn't read a timetable from that image.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong reading the image.");
    } finally {
      setBusy(false);
    }
  };

  const sessionCount = preview?.sessions.length ?? 0;

  return (
    <Card variant="section" padding="md" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={15} aria-hidden className="text-accent" />
          <MonoLabel tone="subtle">Import from a photo</MonoLabel>
        </div>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={busy ? <Loader2 size={14} className="animate-spin" /> : <ImageUp size={14} />}
          onClick={() => fileRef.current?.click()}
          disabled={busy || importMut.isPending}
        >
          {busy ? "Reading…" : "Upload timetable"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {!preview && !error && !busy ? (
        <Text variant="caption" tone="subtle">
          Snap or upload a photo of your timetable and it&apos;s read into classes you can review
          before adding. Clear, straight-on photos work best.
        </Text>
      ) : null}

      {error ? (
        <div className="text-warning flex items-start gap-2">
          <AlertCircle size={14} aria-hidden className="mt-0.5 shrink-0" />
          <Text variant="body-s" className="text-warning">
            {error}
          </Text>
        </div>
      ) : null}

      {preview ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Text variant="body-s" className="font-medium">
              Found {sessionCount} {sessionCount === 1 ? "class" : "classes"} across{" "}
              {preview.courses.length} {preview.courses.length === 1 ? "course" : "courses"}
            </Text>
            <MonoLabel tone="subtle">review before adding</MonoLabel>
          </div>

          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {preview.sessions.map((s, i) => (
              <div
                key={`${s.courseTitle}-${s.weekday}-${s.start}-${i}`}
                className="border-border bg-surface flex items-center gap-2 rounded-md border px-2.5 py-1.5"
              >
                <Badge variant="outline" size="sm" className="w-11 justify-center">
                  {WEEKDAYS[s.weekday] ?? "?"}
                </Badge>
                <Text variant="body-s" className="min-w-0 flex-1 truncate">
                  {s.courseTitle}
                </Text>
                <Text variant="caption" tone="subtle" className="tabular-nums">
                  {s.start}–{s.end}
                </Text>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreview(null)}
              disabled={importMut.isPending}
            >
              Discard
            </Button>
            <Button
              size="sm"
              onClick={() => importMut.mutate(preview, { onSuccess: () => setPreview(null) })}
              loading={importMut.isPending}
              disabled={sessionCount === 0}
            >
              Add {sessionCount} to timetable
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
