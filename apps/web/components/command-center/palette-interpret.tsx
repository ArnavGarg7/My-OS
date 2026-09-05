"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Inbox, Loader2, Sparkles, Zap } from "lucide-react";
import { Badge, Button, MonoLabel, Text } from "@myos/ui";
import type { IntentPreview } from "@myos/core/interaction";
import { trpc } from "@/lib/trpc/client";
import { useToaster } from "@/lib/framework";

/**
 * Omni natural-language interpretation (Stage 9). When no command matches, the query is
 * interpreted into a grounded, previewable intent (deterministic first, AI only as a
 * fallback) and — on confirm — executed through the EXISTING capabilities. Ambiguous
 * requests ask for clarification (never guess). Unknown falls back to the Inbox capture the
 * palette always offered. Registers its primary action so Enter runs it. Not a chat window.
 */
export function PaletteInterpret({
  query,
  onClose,
  register,
}: {
  query: string;
  onClose: () => void;
  register: (fn: (() => void) | null) => void;
}) {
  const router = useRouter();
  const toaster = useToaster();
  const utils = trpc.useUtils();
  const [preview, setPreview] = useState<IntentPreview | null>(null);

  const interpret = trpc.interaction.interpret.useMutation({ onSuccess: setPreview });
  const execute = trpc.interaction.execute.useMutation();
  const capture = trpc.inbox.capture.useMutation();

  const location =
    typeof window !== "undefined" ? window.localStorage.getItem("myos.weather.location") : null;

  // Debounced interpret as the query settles.
  useEffect(() => {
    setPreview(null);
    if (query.length < 2) return;
    const id = setTimeout(() => interpret.mutate({ text: query, location }), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const runInbox = () => {
    if (query.length < 2) return;
    capture.mutate(
      { type: "text", content: query, source: "quick_add" },
      {
        onSuccess: () => {
          toaster.success("Captured to Inbox");
          onClose();
        },
      },
    );
  };

  const runPreview = (taskId?: string) => {
    if (!preview) return;
    if (preview.intent.kind === "unknown") return runInbox();
    if (preview.executable || taskId) {
      execute.mutate(
        { intent: preview.intent, taskId: taskId ?? null, location },
        {
          onSuccess: (res) => {
            toaster.success(res.message);
            void utils.invalidate();
            if (res.navigateHref) router.push(res.navigateHref);
            onClose();
          },
          onError: (e) => toaster.error("Couldn't do that", e.message),
        },
      );
    } else if (preview.navigateHref) {
      router.push(preview.navigateHref);
      onClose();
    }
  };

  // Register the primary action for Enter.
  const runRef = useRef<() => void>(() => {});
  runRef.current = () => (preview ? runPreview() : runInbox());
  useEffect(() => {
    register(() => runRef.current());
    return () => register(null);
  }, [register]);

  if (interpret.isPending && !preview) {
    return (
      <div className="flex items-center justify-center gap-2 py-6">
        <Loader2 size={14} className="text-fg-subtle animate-spin" aria-hidden />
        <Text variant="body-s" tone="subtle">
          Understanding…
        </Text>
      </div>
    );
  }

  if (!preview) {
    return (
      <button
        type="button"
        onClick={runInbox}
        className="border-border hover:bg-elevated flex w-full items-center justify-center gap-2 rounded-md border border-dashed px-3 py-3"
      >
        <Inbox size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="body-s" tone="subtle">
          Capture “{query}” to Inbox
        </Text>
      </button>
    );
  }

  const isUnknown = preview.intent.kind === "unknown";
  return (
    <div className="border-border bg-elevated flex w-full flex-col gap-3 rounded-lg border p-3 text-left">
      <div className="flex items-center gap-2">
        <Sparkles size={13} className="text-accent" aria-hidden />
        <MonoLabel tone={isUnknown ? "subtle" : "accent"}>{preview.title}</MonoLabel>
        {preview.source === "ai" ? (
          <Badge size="sm" variant="neutral">
            interpreted
          </Badge>
        ) : null}
      </div>
      <Text variant="body-m">{preview.summary}</Text>

      {preview.clarification ? (
        <div className="flex flex-col gap-1.5">
          <Text variant="caption" tone="subtle">
            {preview.clarification.question}
          </Text>
          {preview.clarification.options.map((o) => (
            <Button
              key={o.id}
              size="sm"
              variant="secondary"
              onClick={() => runPreview(o.id)}
              disabled={execute.isPending}
            >
              {o.label}
            </Button>
          ))}
        </div>
      ) : isUnknown ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={runInbox}
          leftIcon={<Inbox size={13} aria-hidden />}
        >
          Capture “{query}” to Inbox
        </Button>
      ) : preview.executable ? (
        <Button
          size="sm"
          variant="primary"
          onClick={() => runPreview()}
          disabled={execute.isPending}
          leftIcon={
            preview.intent.kind === "start_focus" ? (
              <Zap size={13} aria-hidden />
            ) : (
              <ArrowRight size={13} aria-hidden />
            )
          }
        >
          {preview.intent.kind === "create_task"
            ? "Create"
            : preview.intent.kind === "capture_inbox"
              ? "Capture"
              : preview.intent.kind === "start_focus"
                ? "Start focus"
                : "Run"}
        </Button>
      ) : preview.navigateHref ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => runPreview()}
          leftIcon={<ArrowRight size={13} aria-hidden />}
        >
          Open
        </Button>
      ) : null}
    </div>
  );
}
