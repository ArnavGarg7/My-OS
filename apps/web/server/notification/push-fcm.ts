import "server-only";
import { createSign } from "node:crypto";
import { eq } from "drizzle-orm";
import { pushDevices } from "@myos/db/schema";
import { isFcmConfigured } from "@myos/shared/env";
import type { Database } from "@myos/db";
import type { Notification } from "@myos/core/notification";
import { getEnv } from "@/server/env";

/**
 * Server-side FCM sender (Stage D — native Android push). This is the "Oracle server → FCM HTTP v1
 * → Play Services → app" leg: the OS originates a notification, and this hands it to Firebase Cloud
 * Messaging so it reaches the device even when the app is closed. Nothing else about the stack lives
 * in Firebase — FCM is only the last-mile courier.
 *
 * Fully guarded and env-gated: with no service-account configured (`MYOS_FCM_*`), every entry point
 * is a silent no-op, so it is safe to ship before the Firebase project exists. Authentication is a
 * self-signed service-account JWT exchanged for a short-lived OAuth access token (cached in-process);
 * no `google-auth-library` dependency. Tokens that FCM reports as UNREGISTERED are pruned.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Present the service-account credentials once, or null when not configured. */
function credentials(): { projectId: string; clientEmail: string; privateKey: string } | null {
  const env = getEnv();
  if (!isFcmConfigured(env)) return null;
  return {
    projectId: env.MYOS_FCM_PROJECT_ID!,
    clientEmail: env.MYOS_FCM_CLIENT_EMAIL!,
    // Single-line env values escape PEM newlines as "\n"; restore them for the signer.
    privateKey: env.MYOS_FCM_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  };
}

/** Cached OAuth access token (FCM tokens last ~1h; refresh a minute early). */
let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(clientEmail: string, privateKey: string): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: clientEmail,
      scope: FCM_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${b64url(signer.sign(privateKey))}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 - 60_000,
  };
  return cachedToken.value;
}

/** Only string→string data is allowed by FCM; drop everything else. */
function stringData(record: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(record)) {
    if (typeof v === "string") out[k] = v;
    else if (typeof v === "number" || typeof v === "boolean") out[k] = String(v);
  }
  return out;
}

/**
 * Deliver one notification to every registered device via FCM. Never throws — a push failure must
 * never break the in-app delivery that already succeeded. Returns how many devices were reached.
 */
export async function sendPushForNotification(
  db: Database,
  notification: Notification,
): Promise<{ sent: number; pruned: number }> {
  const creds = credentials();
  if (!creds) return { sent: 0, pruned: 0 };

  let devices: { token: string }[];
  try {
    devices = await db.select({ token: pushDevices.token }).from(pushDevices);
  } catch {
    return { sent: 0, pruned: 0 };
  }
  if (devices.length === 0) return { sent: 0, pruned: 0 };

  const token = await accessToken(creds.clientEmail, creds.privateKey).catch(() => null);
  if (!token) return { sent: 0, pruned: 0 };

  const endpoint = `https://fcm.googleapis.com/v1/projects/${creds.projectId}/messages:send`;
  const data = stringData({
    notificationId: notification.id,
    type: notification.type,
    source: notification.source,
    ...(notification.sourceHref ? { href: notification.sourceHref } : {}),
  });

  let sent = 0;
  let pruned = 0;
  for (const device of devices) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          message: {
            token: device.token,
            notification: { title: notification.title, body: notification.reason },
            data,
            android: { priority: "high", notification: { default_sound: true } },
          },
        }),
      });
      if (res.ok) {
        sent += 1;
        continue;
      }
      // A stale/rotated token returns 404 NOT_FOUND (UNREGISTERED) or 400 INVALID_ARGUMENT — prune it
      // so the device list stays clean. Other errors (auth/quota) are transient; leave the token.
      if (res.status === 404 || res.status === 400) {
        await db
          .delete(pushDevices)
          .where(eq(pushDevices.token, device.token))
          .catch(() => {});
        pruned += 1;
      }
    } catch {
      // Network hiccup — skip this device this round; the next notification retries.
    }
  }
  return { sent, pruned };
}
