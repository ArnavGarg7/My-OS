"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Compass, ListChecks, X } from "lucide-react";
import { Button, Card, Text } from "@myos/ui";

const DISMISS_KEY = "myos.onboarding.getstarted.dismissed";

/**
 * First-run "Get started" card (UX onboarding pass). Shown at the top of Today until the user
 * dismisses it, so a brand-new person lands on a few concrete next steps instead of a wall of
 * "No X yet." Purely a guide — links out to real surfaces, changes nothing on its own. The dismissal
 * is remembered per-viewer (localStorage); it never reappears once closed.
 */
export function GetStartedCard() {
  // Default hidden so returning users (who've dismissed it) never see a flash before storage is read.
  const [dismissed, setDismissed] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
    setReady(true);
  }, []);

  if (!ready || dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* storage unavailable — hide for this session anyway */
    }
    setDismissed(true);
  };

  return (
    <Card className="relative flex flex-col gap-3 p-5">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss getting-started"
        className="text-fg-subtle hover:text-fg focus-visible:ring-ring absolute right-3 top-3 rounded-sm outline-none focus-visible:ring-1"
      >
        <X size={16} aria-hidden />
      </button>

      <Text variant="heading-s">Welcome to My OS 👋</Text>
      <Text variant="body-s" className="text-fg-muted">
        Your whole day in one place. Here are three quick ways to get going — nothing here acts on
        its own; you’re always in control.
      </Text>

      <div className="grid gap-2 sm:grid-cols-3">
        <Link href="/inbox" className="contents">
          <Button
            variant="secondary"
            className="w-full justify-start"
            leftIcon={<ListChecks size={15} aria-hidden />}
          >
            Capture a task
          </Button>
        </Link>
        <Link href="/planner" className="contents">
          <Button
            variant="secondary"
            className="w-full justify-start"
            leftIcon={<CalendarClock size={15} aria-hidden />}
          >
            Plan your day
          </Button>
        </Link>
        <Link href="/chief" className="contents">
          <Button
            variant="secondary"
            className="w-full justify-start"
            leftIcon={<Compass size={15} aria-hidden />}
          >
            Ask your Chief
          </Button>
        </Link>
      </div>

      <Text variant="caption" className="text-fg-subtle">
        Sections below fill in as you use My OS — open “More in today’s briefing” to explore
        everything.
      </Text>
    </Card>
  );
}
