import "server-only";
import { CONNECTOR_PROVIDERS } from "@myos/core/connectors";

/**
 * Connector live-availability (Stage 4). A LIVE connection needs real provider
 * credentials configured on the server. When they are absent, a connector can
 * still be exercised end-to-end against a clearly-labelled SAMPLE feed — but the
 * platform must never present sample data as a real integration. This module is
 * the single source of truth for "can this provider connect for real?", derived
 * only from server env, and it feeds the honest `sample`/`live` labelling the UI
 * shows everywhere connector data appears.
 *
 * The env var per provider is the credential a real OAuth/token/API-key flow
 * would require. None are configured in this environment, so every provider is
 * honestly `liveAvailable: false` → any connection made now is a sample.
 */
const LIVE_ENV: Record<string, string> = {
  "google-calendar": "MYOS_GOOGLE_CLIENT_ID",
  gmail: "MYOS_GOOGLE_CLIENT_ID",
  "google-drive": "MYOS_GOOGLE_CLIENT_ID",
  github: "MYOS_GITHUB_CLIENT_ID",
  slack: "MYOS_SLACK_CLIENT_ID",
  weather: "MYOS_OPENWEATHER_API_KEY",
};

export interface ProviderCapability {
  providerId: string;
  /** True only when real credentials are configured — a live connection is possible. */
  liveAvailable: boolean;
  /** The env var that would enable a live connection (never its value). */
  requires: string | null;
}

/** Pure derivation — takes an env snapshot so it is unit-testable without process.env. */
export function deriveCapabilities(env: Record<string, string | undefined>): ProviderCapability[] {
  return CONNECTOR_PROVIDERS.map((p) => {
    const requires = LIVE_ENV[p.id] ?? null;
    const liveAvailable = requires ? Boolean(env[requires]) : false;
    return { providerId: p.id, liveAvailable, requires };
  });
}

/** Live-availability for one provider from the current process env. */
export function providerLiveAvailable(providerId: string): boolean {
  const requires = LIVE_ENV[providerId];
  return requires ? Boolean(process.env[requires]) : false;
}

/** The full capability map from the current process env. */
export function capabilities(): ProviderCapability[] {
  return deriveCapabilities(process.env);
}

/** True when at least one provider could connect live (drives global honest copy). */
export function anyLiveAvailable(): boolean {
  return capabilities().some((c) => c.liveAvailable);
}
