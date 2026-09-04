"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plug, RefreshCw, ShieldCheck } from "lucide-react";
import { useToaster } from "@/lib/framework";
import { useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { trpc } from "@/lib/trpc/client";

/**
 * Connector command group (Stage 4). Reaches the connector CAPABILITIES from the
 * Omni Launcher — the same application capabilities a future voice interface will
 * invoke ("sync my calendar"). "Sync all" resolves through the existing
 * connectors.sync capability. Mounted always (mutation-only, no queries at mount)
 * so it is registered regardless of which route is open. Mirrors the proven
 * TaskCommands registration shape.
 */
export function ConnectorCommands() {
  const router = useRouter();
  const toaster = useToaster();
  const utils = trpc.useUtils();
  const sync = trpc.connectors.sync.useMutation();

  const groups = useMemo<CommandGroup[]>(() => {
    const syncAll = async () => {
      const listed = await utils.connectors.list.fetch().catch(() => null);
      const accounts = (listed?.providers ?? []).flatMap((p) => p.accounts.map((a) => a.id));
      if (accounts.length === 0) {
        toaster.info("No connectors connected", "Connect a service on the Connectors page.");
        router.push("/connectors");
        return;
      }
      let ok = 0;
      for (const accountId of accounts) {
        const r = await sync.mutateAsync({ accountId, trigger: "manual" }).catch(() => null);
        if (r?.ok) ok += 1;
      }
      await utils.connectors.invalidate();
      toaster.success("Connectors synced", `${ok}/${accounts.length} synced.`);
    };

    return [
      {
        id: "connectors",
        title: "Connectors",
        category: "connectors",
        priority: 60,
        commands: [
          {
            id: "connectors:open",
            title: "Open Connectors",
            subtitle: "Manage external services",
            category: "connectors",
            icon: Plug,
            keywords: ["connectors", "integrations", "external", "services", "connect", "calendar"],
            execute: (ctx) => {
              ctx.close();
              router.push("/connectors");
            },
          },
          {
            id: "connectors:sync-all",
            title: "Sync all connectors",
            subtitle: "Pull the latest external changes",
            category: "connectors",
            icon: RefreshCw,
            keywords: ["sync", "refresh", "connectors", "calendar", "external", "update"],
            execute: (ctx) => {
              ctx.close();
              void syncAll();
            },
          },
          {
            id: "connectors:permissions",
            title: "Review connector permissions",
            subtitle: "Scopes and security",
            category: "connectors",
            icon: ShieldCheck,
            keywords: ["permissions", "scopes", "security", "connectors"],
            execute: (ctx) => {
              ctx.close();
              router.push("/connectors");
            },
          },
        ],
      },
    ];
  }, [router, toaster, utils, sync]);

  useRegisterGroups(groups);
  return null;
}
