"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MonoLabel, Popover, PopoverContent, PopoverTrigger, Text } from "@myos/ui";
import { useConnection, usePlatform } from "@/lib/platform";
import { trpc } from "@/lib/trpc/client";

type Tone = "success" | "warning" | "danger" | "muted";

const DOT: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  muted: "bg-fg-subtle",
};

function StatusRow({
  label,
  value,
  tone,
  href,
}: {
  label: string;
  value: string;
  tone: Tone;
  href?: string;
}) {
  const inner = (
    <>
      <span className="flex items-center gap-2">
        <span aria-hidden className={`size-1.5 rounded-full ${DOT[tone]}`} />
        <Text variant="body-s" tone="muted">
          {label}
        </Text>
      </span>
      <Text variant="body-s" className="text-caption font-mono tabular-nums">
        {value}
      </Text>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="hover:bg-elevated -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-1"
      >
        {inner}
      </Link>
    );
  }
  return <div className="flex items-center justify-between gap-3 py-1">{inner}</div>;
}

/**
 * System status surface (V2 Stage 1). Behind the top-bar "Connected" pill: shows
 * what My OS is actually connected to right now — the local environment
 * (network, database, sync) and, architecturally ready for the integrations
 * roadmap, the external connections. Nothing here is faked: a connector that
 * isn't wired reads "Not connected".
 */
export function SystemStatusPopover() {
  const connection = useConnection();
  const platform = usePlatform();
  const health = trpc.system.health.useQuery(undefined, {
    refetchInterval: 60_000,
    retry: 1,
  });
  const connectors = trpc.connectors.list.useQuery(undefined, { staleTime: 300_000 });

  const dbOk = health.data?.db ?? false;
  const online = connection.online;
  const allGood = online && dbOk;
  const connectedCount = connectors.data?.connectedCount ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="System status"
          className="border-border text-fg-subtle hover:text-fg-muted hover:bg-elevated focus-visible:ring-ring inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] outline-none transition-colors focus-visible:ring-2"
        >
          <span
            aria-hidden
            className={`size-1.5 rounded-full ${allGood ? "bg-success" : online ? "bg-warning" : "bg-danger"}`}
          />
          {online ? "Connected" : "Offline"}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <MonoLabel tone="subtle">Environment</MonoLabel>
            <div className="flex flex-col">
              <StatusRow
                label="Network"
                value={online ? (connection.effectiveType ?? "online") : "offline"}
                tone={online ? "success" : "danger"}
              />
              <StatusRow
                label="Database"
                value={health.isLoading ? "checking…" : dbOk ? "connected" : "unreachable"}
                tone={health.isLoading ? "muted" : dbOk ? "success" : "danger"}
              />
              <StatusRow
                label="Background sync"
                value={platform.capabilities.backgroundSync ? "ready" : "unavailable"}
                tone={platform.capabilities.backgroundSync ? "success" : "muted"}
              />
              <StatusRow label="Version" value={`v${platform.appVersion}`} tone="muted" />
            </div>
          </div>

          <div className="border-border flex flex-col gap-1 border-t pt-3">
            <div className="flex items-center justify-between">
              <MonoLabel tone="subtle">Connections</MonoLabel>
              <MonoLabel tone="subtle">
                {connectedCount} / {connectors.data?.providers.length ?? 0}
              </MonoLabel>
            </div>
            <div className="flex flex-col">
              {(connectors.data?.providers ?? []).slice(0, 6).map((p) => (
                <StatusRow
                  key={p.id}
                  label={p.name}
                  value={p.connected ? (p.sample ? "sample" : "connected") : "not connected"}
                  tone={p.connected ? (p.sample ? "warning" : "success") : "muted"}
                  href="/connectors"
                />
              ))}
              {!connectors.data ? (
                <Text variant="body-s" tone="subtle" className="py-1">
                  {connectors.isLoading ? "Loading…" : "Connections unavailable"}
                </Text>
              ) : null}
            </div>
            <Link
              href="/connectors"
              className="text-fg-subtle hover:text-fg text-body-s mt-1 inline-flex items-center gap-0.5"
            >
              Manage connectors <ChevronRight size={13} aria-hidden />
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
