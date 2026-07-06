"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Field,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  useTheme,
  type Theme,
} from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { useIdentity } from "@/lib/identity";
import { THEMES, TIMEZONES } from "@/lib/identity/options";

/**
 * Minimal first-login flow (Sprint 1.5): name, timezone, theme, day bounds.
 * No tutorial, no walkthrough — collect, persist, continue into the shell.
 */
export function OnboardingForm({
  defaultName,
  defaultTimezone,
  landingPage,
}: {
  defaultName: string;
  defaultTimezone: string;
  landingPage: string;
}) {
  const router = useRouter();
  const { refresh } = useIdentity();
  const { setTheme: applyTheme } = useTheme();

  const [displayName, setDisplayName] = useState(defaultName);
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [theme, setTheme] = useState<Theme>("dark");
  const [startOfDay, setStartOfDay] = useState("06:00");
  const [endOfDay, setEndOfDay] = useState("22:00");

  const complete = trpc.me.completeOnboarding.useMutation({
    onSuccess: () => {
      refresh();
      router.replace(landingPage);
      router.refresh();
    },
  });

  const validBounds = startOfDay < endOfDay;
  const canSubmit = displayName.trim().length > 0 && validBounds;

  function chooseTheme(next: Theme) {
    setTheme(next);
    applyTheme(next); // live preview
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        complete.mutate({
          displayName: displayName.trim(),
          timezone,
          theme,
          preferredStartOfDay: startOfDay,
          preferredEndOfDay: endOfDay,
        });
      }}
      className="border-border bg-surface shadow-e2 w-full max-w-md rounded-xl border p-6"
    >
      <Text variant="heading-m" className="mb-1">
        Welcome to My OS
      </Text>
      <Text variant="body-s" className="text-fg-subtle mb-5">
        A few basics so the OS fits you. You can change all of this later in Preferences.
      </Text>

      <div className="flex flex-col gap-4">
        <Field label="Display name" required>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="What should I call you?"
            autoFocus
            maxLength={80}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <Label>Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Theme</Label>
          <Select value={theme} onValueChange={(v) => chooseTheme(v as Theme)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start of day">
            <Input type="time" value={startOfDay} onChange={(e) => setStartOfDay(e.target.value)} />
          </Field>
          <Field label="End of day" {...(validBounds ? {} : { error: "Must be after start" })}>
            <Input type="time" value={endOfDay} onChange={(e) => setEndOfDay(e.target.value)} />
          </Field>
        </div>
      </div>

      {complete.error ? (
        <Text variant="body-s" className="text-danger mt-4">
          {complete.error.message}
        </Text>
      ) : null}

      <Button
        type="submit"
        className="mt-6 w-full"
        loading={complete.isPending}
        disabled={!canSubmit}
      >
        Enter My OS
      </Button>
    </form>
  );
}
