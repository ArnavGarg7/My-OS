/**
 * Connector Registry (Sprint 6.4, spec §Connector Registry). The built-in, discoverable provider
 * descriptors. Registered once, immutable. Read-first / read-only in Sprint 6.4 (no sending). Pure
 * data — no credentials, no IO. The server binds real OAuth/HTTP; this only declares capabilities.
 */
import type { ConnectorProvider } from "./types";

export const CONNECTOR_PROVIDERS: readonly ConnectorProvider[] = [
  {
    id: "google-calendar",
    provider: "google",
    name: "Google Calendar",
    category: "calendar",
    version: "1",
    auth: "oauth2",
    permissions: ["calendar.readonly"],
    supportedEvents: [
      "calendar.meeting_created",
      "calendar.meeting_cancelled",
      "calendar.meeting_moved",
    ],
    syncStrategy: "webhook",
    webhookCapable: true,
    readOnly: true,
  },
  {
    id: "gmail",
    provider: "google",
    name: "Gmail",
    category: "email",
    version: "1",
    auth: "oauth2",
    permissions: ["gmail.readonly"],
    supportedEvents: [
      "gmail.important_email",
      "gmail.calendar_invite",
      "gmail.bill_reminder",
      "gmail.travel_confirmation",
    ],
    syncStrategy: "polling",
    webhookCapable: true,
    readOnly: true,
  },
  {
    id: "github",
    provider: "github",
    name: "GitHub",
    category: "code",
    version: "1",
    auth: "personal_token",
    permissions: ["repo:read"],
    supportedEvents: [
      "github.pr_opened",
      "github.pr_merged",
      "github.review_requested",
      "github.issue_assigned",
      "github.ci_failed",
    ],
    syncStrategy: "webhook",
    webhookCapable: true,
    readOnly: true,
  },
  {
    id: "google-drive",
    provider: "google",
    name: "Google Drive",
    category: "storage",
    version: "1",
    auth: "oauth2",
    permissions: ["drive.metadata.readonly"],
    supportedEvents: ["drive.file_shared", "drive.document_updated", "drive.storage_warning"],
    syncStrategy: "polling",
    webhookCapable: true,
    readOnly: true,
  },
  {
    id: "slack",
    provider: "slack",
    name: "Slack",
    category: "chat",
    version: "1",
    auth: "oauth2",
    permissions: ["channels:read"],
    supportedEvents: [
      "slack.mention",
      "slack.thread_reply",
      "slack.direct_message",
      "slack.channel_invite",
    ],
    syncStrategy: "webhook",
    webhookCapable: true,
    readOnly: true,
  },
  {
    id: "weather",
    provider: "openweather",
    name: "Weather",
    category: "weather",
    version: "1",
    auth: "api_key",
    permissions: ["forecast.read"],
    supportedEvents: [
      "weather.rain_forecast",
      "weather.temperature_alert",
      "weather.storm_warning",
    ],
    syncStrategy: "polling",
    webhookCapable: false,
    readOnly: true,
  },
];

/** Look up a provider descriptor by id. */
export function getProvider(id: string): ConnectorProvider | null {
  return CONNECTOR_PROVIDERS.find((p) => p.id === id) ?? null;
}

/** Providers in a category. */
export function providersByCategory(category: ConnectorProvider["category"]): ConnectorProvider[] {
  return CONNECTOR_PROVIDERS.filter((p) => p.category === category);
}
