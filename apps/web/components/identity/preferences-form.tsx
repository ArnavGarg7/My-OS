"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
  useTheme,
  type Theme,
} from "@myos/ui";
import { PageContainer, PageContent, PageHeader } from "@/components/framework";
import { usePreferences, useToaster } from "@/lib/framework";
import { trpc } from "@/lib/trpc/client";
import { useIdentity } from "@/lib/identity";
import {
  CURRENCIES,
  DATE_FORMATS,
  LANDING_PAGES,
  LANGUAGES,
  LOCALES,
  THEMES,
  TIME_FORMATS,
  TIMEZONES,
} from "@/lib/identity/options";
import type { UserPreferences } from "@/server/identity/types";
import { PlatformDiagnostics } from "@/components/platform/platform-diagnostics";
import { InboxPreferences } from "@/components/inbox/InboxPreferences";
import { LabeledSelect, ToggleRow } from "./form-controls";

/**
 * Preferences page (Sprint 1.5). Writes the app's source-of-truth
 * `user_preferences` via the IdentityService, and mirrors appearance settings
 * into the framework's runtime (theme + PreferencesProvider) so the UI reacts
 * immediately — without bypassing any framework abstraction.
 */
export function PreferencesForm({ preferences }: { preferences: UserPreferences }) {
  const { refresh } = useIdentity();
  const { setTheme: applyTheme } = useTheme();
  const { setPreference } = usePreferences();
  const toaster = useToaster();

  const [form, setForm] = useState<UserPreferences>(preferences);
  const set = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function onSave() {
    // `displayName` is nullable in the DTO but the update schema expects a string;
    // omit it when unset rather than sending an explicit null/undefined.
    const { displayName, ...rest } = form;
    save.mutate({ ...rest, ...(displayName ? { displayName } : {}) });
  }

  const save = trpc.me.updatePreferences.useMutation({
    onSuccess: () => {
      refresh();
      // Reflect appearance choices into the running app immediately.
      applyTheme(form.theme);
      setPreference("reduceMotion", form.reducedMotion);
      setPreference("compactDensity", form.compactMode);
      toaster.success("Preferences saved");
    },
    onError: (e) => toaster.error("Couldn’t save preferences", e.message),
  });

  return (
    <PageContainer width="content">
      <PageHeader
        title="Preferences"
        description="Personalize how My OS looks and behaves."
        actions={
          <Button onClick={onSave} loading={save.isPending}>
            Save preferences
          </Button>
        }
      />
      <PageContent>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card padding="lg" className="flex flex-col gap-4">
            <CardHeader className="p-0">
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Theme, density and motion.</CardDescription>
            </CardHeader>
            <LabeledSelect
              label="Theme"
              value={form.theme}
              onChange={(v) => {
                set("theme", v as Theme);
                applyTheme(v as Theme);
              }}
              options={THEMES}
            />
            <ToggleRow
              label="Compact mode"
              description="Tighten spacing across the app."
              checked={form.compactMode}
              onChange={(v) => set("compactMode", v)}
            />
            <ToggleRow
              label="Reduced motion"
              description="Minimize animations and transitions."
              checked={form.reducedMotion}
              onChange={(v) => set("reducedMotion", v)}
            />
          </Card>

          <Card padding="lg" className="flex flex-col gap-4">
            <CardHeader className="p-0">
              <CardTitle>Localization</CardTitle>
              <CardDescription>Region, language and formats.</CardDescription>
            </CardHeader>
            <LabeledSelect
              label="Timezone"
              value={form.timezone}
              onChange={(v) => set("timezone", v)}
              options={TIMEZONES}
            />
            <div className="grid grid-cols-2 gap-3">
              <LabeledSelect
                label="Locale"
                value={form.locale}
                onChange={(v) => set("locale", v)}
                options={LOCALES}
              />
              <LabeledSelect
                label="Language"
                value={form.language}
                onChange={(v) => set("language", v)}
                options={LANGUAGES}
              />
              <LabeledSelect
                label="Currency"
                value={form.preferredCurrency}
                onChange={(v) => set("preferredCurrency", v)}
                options={CURRENCIES}
              />
              <LabeledSelect
                label="Date format"
                value={form.preferredDateFormat}
                onChange={(v) => set("preferredDateFormat", v)}
                options={DATE_FORMATS}
              />
            </div>
            <LabeledSelect
              label="Time format"
              value={form.preferredTimeFormat}
              onChange={(v) => set("preferredTimeFormat", v as "12h" | "24h")}
              options={TIME_FORMATS}
            />
          </Card>

          <Card padding="lg" className="flex flex-col gap-4">
            <CardHeader className="p-0">
              <CardTitle>Shell & daily rhythm</CardTitle>
              <CardDescription>Defaults for navigation and your day.</CardDescription>
            </CardHeader>
            <LabeledSelect
              label="Default landing page"
              value={form.defaultLandingPage}
              onChange={(v) => set("defaultLandingPage", v)}
              options={LANDING_PAGES}
            />
            <ToggleRow
              label="Start with sidebar collapsed"
              checked={form.sidebarCollapsed}
              onChange={(v) => set("sidebarCollapsed", v)}
            />
            <div className="grid grid-cols-3 gap-3">
              <Field label="Focus (min)">
                <Input
                  type="number"
                  min={5}
                  max={180}
                  value={String(form.defaultFocusDuration)}
                  onChange={(e) => set("defaultFocusDuration", Number(e.target.value) || 0)}
                />
              </Field>
              <Field label="Start of day">
                <Input
                  type="time"
                  value={form.preferredStartOfDay}
                  onChange={(e) => set("preferredStartOfDay", e.target.value)}
                />
              </Field>
              <Field label="End of day">
                <Input
                  type="time"
                  value={form.preferredEndOfDay}
                  onChange={(e) => set("preferredEndOfDay", e.target.value)}
                />
              </Field>
            </div>
          </Card>

          <Card padding="lg" className="flex flex-col gap-3">
            <CardHeader className="p-0">
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Preferences only — delivery arrives later.</CardDescription>
            </CardHeader>
            <ToggleRow
              label="Notification sound"
              checked={form.notificationSoundEnabled}
              onChange={(v) => set("notificationSoundEnabled", v)}
            />
            <ToggleRow
              label="Desktop notifications"
              checked={form.desktopNotificationsEnabled}
              onChange={(v) => set("desktopNotificationsEnabled", v)}
            />
            <ToggleRow
              label="Mobile notifications"
              checked={form.mobileNotificationsEnabled}
              onChange={(v) => set("mobileNotificationsEnabled", v)}
            />
            <ToggleRow
              label="Auto-launch Morning Briefing"
              description="Open the briefing automatically at start of day."
              checked={form.autoLaunchMorningBriefing}
              onChange={(v) => set("autoLaunchMorningBriefing", v)}
            />
          </Card>

          <InboxPreferences />

          <PlatformDiagnostics />
        </div>
      </PageContent>
    </PageContainer>
  );
}
