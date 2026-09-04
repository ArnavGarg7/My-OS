import Link from "next/link";
import { Button, Emblem, Text } from "@myos/ui";

/**
 * 404 — a route that doesn't exist in My OS. Kept calm and on-brand: the emblem,
 * a plain explanation, and one way back to the operational home.
 */
export default function NotFound() {
  return (
    <main className="bg-base text-fg flex min-h-dvh flex-col items-center justify-center gap-5 p-6 text-center">
      <Emblem size={44} />
      <div className="flex flex-col gap-1.5">
        <Text variant="mono" tone="subtle" className="uppercase tracking-[0.1em]">
          404 · Not found
        </Text>
        <Text variant="display-m" asChild>
          <h1>This isn't part of My OS</h1>
        </Text>
        <Text variant="body-m" tone="muted" className="max-w-sm">
          The page you're after doesn't exist — it may have moved, or the link is stale.
        </Text>
      </div>
      <Button asChild>
        <Link href="/command-center">Back to Command Center</Link>
      </Button>
    </main>
  );
}
