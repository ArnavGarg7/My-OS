"use client";

import { ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Text } from "@myos/ui";
import { useIdentity } from "@/lib/identity";

function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.split("@")[0] || "Owner";
  const parts = source.split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? `${parts[0]![0]}${parts[parts.length - 1]![0]}` : source.slice(0, 2);
  return letters.toUpperCase();
}

/**
 * Sidebar footer identity block. Mirrors the Stitch "personal workspace" row —
 * avatar, name, workspace label — and opens the full account menu. The menu
 * itself lives in the top bar's ProfileMenu; here we surface presence + a jump
 * into settings.
 */
export function SidebarProfile({ collapsed = false }: { collapsed?: boolean }) {
  const { identity } = useIdentity();
  const name = identity?.preferences.displayName ?? null;
  const email = identity?.email ?? null;
  const label = name ?? email ?? "Owner";

  return (
    <a
      href="/profile"
      className="border-border hover:bg-elevated focus-visible:ring-ring flex items-center gap-2.5 rounded-lg border px-2 py-1.5 outline-none transition-colors focus-visible:ring-2"
    >
      <Avatar size="sm">
        {identity?.avatarUrl ? <AvatarImage src={identity.avatarUrl} alt="" /> : null}
        <AvatarFallback>{initials(name, email)}</AvatarFallback>
      </Avatar>
      {collapsed ? null : (
        <>
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <Text variant="body-s" className="truncate font-medium">
              {label}
            </Text>
            <Text variant="caption" tone="subtle" className="truncate">
              Personal Workspace
            </Text>
          </div>
          <ChevronsUpDown size={14} aria-hidden className="text-fg-subtle shrink-0" />
        </>
      )}
    </a>
  );
}
