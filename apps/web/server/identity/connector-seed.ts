import "server-only";
import { getDb } from "../db";
import { connectOAuth } from "../connectors/service";
import { oauthConfigured, type TokenBundle } from "../connectors/oauth";

/**
 * Auto-connect the Google connector from the sign-in grant (Google-auth stage, Part B). Sign-in requests
 * the Calendar/Gmail/Drive read scopes with a refresh token, so the same consent that logs the owner in
 * also connects the Google connector — no second OAuth dance. Each provider is seeded only if its scope
 * was actually granted (the user can uncheck scopes on Google's consent screen) and its OAuth app is
 * configured. Fully guarded: a seeding failure never blocks sign-in.
 */
const GOOGLE_CONNECTORS: { scope: string; providerId: string; label: string }[] = [
  {
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    providerId: "google-calendar",
    label: "Google Calendar",
  },
  { scope: "https://www.googleapis.com/auth/gmail.readonly", providerId: "gmail", label: "Gmail" },
  {
    scope: "https://www.googleapis.com/auth/drive.metadata.readonly",
    providerId: "google-drive",
    label: "Google Drive",
  },
];

export async function seedGoogleConnectorsFromGrant(bundle: TokenBundle): Promise<void> {
  if (!bundle.accessToken) return;
  const granted = new Set((bundle.scope ?? "").split(/\s+/).filter(Boolean));
  const { db } = getDb();
  for (const { scope, providerId, label } of GOOGLE_CONNECTORS) {
    if (!granted.has(scope)) continue;
    if (!oauthConfigured(providerId)) continue;
    // One Google grant covers all three scopes, so the same bundle seeds each provider.
    await connectOAuth(db, providerId, bundle, label).catch(() => {});
  }
}
