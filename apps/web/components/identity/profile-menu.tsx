"use client";

import { useRouter } from "next/navigation";
import { LogOut, Monitor, Moon, Palette, Settings, Sun, User } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  useTheme,
  type Theme,
} from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { useIdentity } from "@/lib/identity";

function initials(name: string | null, email: string | null): string {
  const source = name?.trim() || email?.split("@")[0] || "Owner";
  const parts = source.split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? `${parts[0]![0]}${parts[parts.length - 1]![0]}` : source.slice(0, 2);
  return letters.toUpperCase();
}

/**
 * Account menu (Sprint 1.5) — replaces the static avatar. Reads identity via the
 * IdentityService abstraction (never Clerk), and offers Profile, Preferences,
 * a Theme switcher, and Sign out.
 */
export function ProfileMenu() {
  const router = useRouter();
  const { identity, signOut } = useIdentity();
  const { theme, setTheme } = useTheme();
  const updatePreferences = trpc.me.updatePreferences.useMutation();

  const name = identity?.preferences.displayName ?? null;
  const email = identity?.email ?? null;
  const label = name ?? email ?? "Owner";

  function chooseTheme(next: Theme) {
    setTheme(next);
    // Keep the DB source of truth in sync (best-effort; UI already reflects it).
    updatePreferences.mutate({ theme: next });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account"
          className="focus-visible:ring-ring focus-visible:ring-offset-base ml-0.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Avatar size="sm">
            {identity?.avatarUrl ? <AvatarImage src={identity.avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials(name, email)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          <span className="text-body-s text-fg truncate font-medium">{label}</span>
          {email ? (
            <span className="text-caption text-fg-subtle truncate normal-case">{email}</span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => router.push("/profile")}>
          <User size={15} aria-hidden />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/settings")}>
          <Settings size={15} aria-hidden />
          Preferences
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette size={15} aria-hidden />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={(v) => chooseTheme(v as Theme)}>
              <DropdownMenuRadioItem value="light">
                <Sun size={15} aria-hidden />
                Light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon size={15} aria-hidden />
                Dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor size={15} aria-hidden />
                System
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => void signOut()}>
          <LogOut size={15} aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
