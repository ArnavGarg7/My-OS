"use client";

import { usePathname, useRouter } from "next/navigation";
import { Badge, Button, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

/**
 * The persistent Chief Bar (Sprint 5.3). A slim, always-present strip above the status bar that
 * surfaces the Chief's current recommendation on every page and offers one-tap actions plus a jump
 * into the conversation. It CONSUMES the existing Chief `now` recommendation (Sprint 5.2) — it owns
 * no logic of its own. Hidden on the Chief surfaces themselves (where the full experience already
 * lives) to avoid duplication.
 */
export function ChiefBar() {
  const pathname = usePathname();
  const router = useRouter();
  const now = trpc.chief.now.useQuery(undefined, {
    refetchInterval: 300_000,
    staleTime: 120_000,
  });

  // Don't shadow the full Chief experience on its own pages.
  if (pathname === "/chief" || pathname.startsWith("/chief/")) return null;
  if (!now.data) return null;

  const rec = now.data.recommendation;
  const provider = now.data.provider.provider;

  return (
    <div className="border-border bg-elevated flex items-center gap-3 border-t px-4 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <Badge variant="accent">Chief</Badge>
        <Text variant="body-s" className="truncate">
          {rec.title}
        </Text>
        {rec.estimateMinutes !== null ? (
          <Text variant="body-s" className="text-fg-muted hidden sm:inline">
            ~{rec.estimateMinutes} min
          </Text>
        ) : null}
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <Badge
          variant={provider === "local" ? "neutral" : "accent"}
          className="hidden md:inline-flex"
        >
          via {provider}
        </Badge>
        <Button variant="ghost" size="sm" onClick={() => router.push("/chief")}>
          Details
        </Button>
        <Button variant="secondary" size="sm" onClick={() => router.push("/chief/chat")}>
          Chat
        </Button>
      </div>
    </div>
  );
}
