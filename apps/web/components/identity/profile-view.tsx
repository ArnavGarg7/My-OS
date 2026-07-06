"use client";

import { useState } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  Field,
  Input,
  useTheme,
  type Theme,
} from "@myos/ui";
import { APP_VERSION } from "@myos/shared/constants";
import { formatDate, formatRelativeTime } from "@myos/shared/format";
import { PageContainer, PageContent, PageHeader } from "@/components/framework";
import { useToaster } from "@/lib/framework";
import { trpc } from "@/lib/trpc/client";
import { useIdentity } from "@/lib/identity";
import {
  CURRENCIES,
  DATE_FORMATS,
  LANGUAGES,
  LOCALES,
  THEMES,
  TIME_FORMATS,
  TIMEZONES,
} from "@/lib/identity/options";
import type { Identity } from "@/server/identity/types";
import { LabeledSelect, ReadonlyRow } from "./form-controls";

/**
 * Profile page (Sprint 1.5). Identity facts (email, avatar, last login) are
 * read-only and come from the auth provider; the editable fields write to
 * `user_preferences` — the app's source of truth — via the IdentityService.
 */
export function ProfileView({ identity }: { identity: Identity }) {
  const { refresh } = useIdentity();
  const { setTheme: applyTheme } = useTheme();
  const toaster = useToaster();
  const p = identity.preferences;

  const [displayName, setDisplayName] = useState(p.displayName ?? "");
  const [timezone, setTimezone] = useState(p.timezone);
  const [locale, setLocale] = useState(p.locale);
  const [language, setLanguage] = useState(p.language);
  const [currency, setCurrency] = useState(p.preferredCurrency);
  const [dateFormat, setDateFormat] = useState(p.preferredDateFormat);
  const [timeFmt, setTimeFmt] = useState<string>(p.preferredTimeFormat);
  const [theme, setThemeState] = useState<string>(p.theme);

  const save = trpc.me.updateProfile.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Profile updated");
    },
    onError: (e) => toaster.error("Couldn’t save", e.message),
  });

  const initials = (displayName || identity.email || "Owner").slice(0, 2).toUpperCase();

  function onSave() {
    save.mutate({
      displayName: displayName.trim() || "Owner",
      timezone,
      locale,
      language,
      preferredCurrency: currency,
      preferredDateFormat: dateFormat,
      preferredTimeFormat: timeFmt as "12h" | "24h",
      theme: theme as Theme,
    });
  }

  return (
    <PageContainer width="content">
      <PageHeader title="Profile" description="Your identity and how My OS presents to you." />
      <PageContent>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Editable preferences */}
          <Card padding="lg" className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <Avatar size="xl">
                {identity.avatarUrl ? <AvatarImage src={identity.avatarUrl} alt="" /> : null}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-heading-s text-fg truncate">{displayName || "Owner"}</p>
                <p className="text-body-s text-fg-subtle truncate">{identity.email ?? "—"}</p>
              </div>
            </div>

            <Field label="Display name" required>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={80}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <LabeledSelect
                label="Timezone"
                value={timezone}
                onChange={setTimezone}
                options={TIMEZONES}
              />
              <LabeledSelect label="Locale" value={locale} onChange={setLocale} options={LOCALES} />
              <LabeledSelect
                label="Language"
                value={language}
                onChange={setLanguage}
                options={LANGUAGES}
              />
              <LabeledSelect
                label="Currency"
                value={currency}
                onChange={setCurrency}
                options={CURRENCIES}
              />
              <LabeledSelect
                label="Date format"
                value={dateFormat}
                onChange={setDateFormat}
                options={DATE_FORMATS}
              />
              <LabeledSelect
                label="Time format"
                value={timeFmt}
                onChange={setTimeFmt}
                options={TIME_FORMATS}
              />
              <LabeledSelect
                label="Theme"
                value={theme}
                onChange={(v) => {
                  setThemeState(v);
                  applyTheme(v as Theme);
                }}
                options={THEMES}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={onSave} loading={save.isPending}>
                Save changes
              </Button>
            </div>
          </Card>

          {/* Read-only identity facts */}
          <Card padding="lg" variant="section" className="h-fit">
            <div className="text-label text-fg-subtle mb-1">Account</div>
            <div className="divide-border divide-y">
              <ReadonlyRow
                label="Email"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    {identity.email ?? "—"}
                    {identity.emailVerified ? (
                      <CheckCircle2 size={14} className="text-success" aria-label="Verified" />
                    ) : null}
                  </span>
                }
              />
              <ReadonlyRow
                label="Role"
                value={
                  <Badge className="capitalize" variant="neutral">
                    <ShieldCheck size={12} aria-hidden /> {identity.role}
                  </Badge>
                }
              />
              <ReadonlyRow label="Account created" value={formatDate(identity.createdAt)} />
              <ReadonlyRow
                label="Last login"
                value={
                  identity.lastLoginAt ? formatRelativeTime(identity.lastLoginAt) : "This session"
                }
              />
              <ReadonlyRow label="Version" value={`v${APP_VERSION}`} />
            </div>
          </Card>
        </div>
      </PageContent>
    </PageContainer>
  );
}
