import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getEnv } from "../env";

/**
 * Connector OAuth engine (Stage B). Table-driven per-provider config for the standard
 * authorization-code flow: build the consent URL, sign/verify the CSRF `state`, exchange the
 * code for tokens, and refresh an expired access token. Deterministic and dependency-light;
 * the actual HTTP is `fetch`. Secrets stay server-side (read from env here, sealed by the vault
 * before persistence). No AI, no business logic — this only obtains and refreshes credentials.
 */

export interface TokenBundle {
  accessToken: string;
  refreshToken: string | null;
  /** ISO expiry, or null when the provider issues non-expiring tokens (e.g. classic Slack). */
  expiresAt: string | null;
  scope: string | null;
}

interface OAuthConfig {
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  clientIdEnv: "MYOS_GOOGLE_CLIENT_ID" | "MYOS_GITHUB_CLIENT_ID" | "MYOS_SLACK_CLIENT_ID";
  clientSecretEnv:
    "MYOS_GOOGLE_CLIENT_SECRET" | "MYOS_GITHUB_CLIENT_SECRET" | "MYOS_SLACK_CLIENT_SECRET";
  /** Extra authorize-request params (Google needs offline access + consent to return a refresh token). */
  extraAuthParams?: Record<string, string>;
  /** Space vs comma scope joiner (GitHub uses space; all use space here, kept explicit). */
  scopeSeparator: string;
  /**
   * Authorize-request param that carries the scopes. Default `scope`. Slack v2 splits bot (`scope`)
   * from user (`user_scope`) — we request a USER token (channels/history/users read), so Slack uses
   * `user_scope` and the callback reads `authed_user.access_token`.
   */
  scopeParam?: "scope" | "user_scope";
}

const GOOGLE = {
  authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  clientIdEnv: "MYOS_GOOGLE_CLIENT_ID",
  clientSecretEnv: "MYOS_GOOGLE_CLIENT_SECRET",
  // access_type=offline + prompt=consent are required for Google to return a refresh_token.
  extraAuthParams: { access_type: "offline", prompt: "consent", include_granted_scopes: "true" },
  scopeSeparator: " ",
} as const;

const CONFIGS: Record<string, OAuthConfig> = {
  "google-calendar": {
    ...GOOGLE,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  },
  gmail: {
    ...GOOGLE,
    scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
  },
  "google-drive": {
    ...GOOGLE,
    scopes: ["https://www.googleapis.com/auth/drive.metadata.readonly"],
  },
  github: {
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["repo", "read:org"],
    clientIdEnv: "MYOS_GITHUB_CLIENT_ID",
    clientSecretEnv: "MYOS_GITHUB_CLIENT_SECRET",
    scopeSeparator: " ",
  },
  slack: {
    authorizeUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: ["channels:read", "channels:history", "users:read"],
    clientIdEnv: "MYOS_SLACK_CLIENT_ID",
    clientSecretEnv: "MYOS_SLACK_CLIENT_SECRET",
    scopeSeparator: ",",
    scopeParam: "user_scope",
  },
};

/** Provider ids that participate in the live OAuth flow. */
export function isOAuthProvider(providerId: string): boolean {
  return providerId in CONFIGS;
}

function clientId(cfg: OAuthConfig): string | undefined {
  return getEnv()[cfg.clientIdEnv];
}
function clientSecret(cfg: OAuthConfig): string | undefined {
  return getEnv()[cfg.clientSecretEnv];
}

/** True when this provider has its client id AND secret configured (ready for a real OAuth run). */
export function oauthConfigured(providerId: string): boolean {
  const cfg = CONFIGS[providerId];
  return Boolean(cfg && clientId(cfg) && clientSecret(cfg));
}

// ── CSRF state: HMAC-signed `<payloadB64>.<sigB64>` carrying provider + nonce + issued-at ──────
function stateSecret(): string {
  return getEnv().MYOS_CONNECTOR_SECRET ?? "myos-connector-dev-key-offline-only";
}
function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function sign(payload: string): string {
  return b64url(createHmac("sha256", stateSecret()).update(payload).digest());
}

/** Mint a signed state token binding the callback to this provider (10-minute validity). */
export function signState(providerId: string): string {
  const payload = b64url(
    Buffer.from(
      JSON.stringify({ p: providerId, n: randomBytes(8).toString("hex"), t: Date.now() }),
    ),
  );
  return `${payload}.${sign(payload)}`;
}

/** Verify a state token: signature valid, provider matches, issued within the last 10 minutes. */
export function verifyState(state: string | null, providerId: string): boolean {
  if (!state) return false;
  const [payload, sig] = state.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const parsed = JSON.parse(
      Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(),
    );
    return (
      parsed.p === providerId && typeof parsed.t === "number" && Date.now() - parsed.t < 600_000
    );
  } catch {
    return false;
  }
}

/** Build the provider's consent URL. `redirectUri` MUST match the one registered with the provider. */
export function buildAuthorizeUrl(
  providerId: string,
  redirectUri: string,
  state: string,
): string | null {
  const cfg = CONFIGS[providerId];
  const id = cfg && clientId(cfg);
  if (!cfg || !id) return null;
  const params = new URLSearchParams({
    client_id: id,
    redirect_uri: redirectUri,
    response_type: "code",
    [cfg.scopeParam ?? "scope"]: cfg.scopes.join(cfg.scopeSeparator),
    state,
    ...(cfg.extraAuthParams ?? {}),
  });
  return `${cfg.authorizeUrl}?${params.toString()}`;
}

function bundleFrom(json: Record<string, unknown>): TokenBundle {
  const accessToken = String(json.access_token ?? "");
  const refreshToken = json.refresh_token ? String(json.refresh_token) : null;
  const expiresIn = typeof json.expires_in === "number" ? json.expires_in : null;
  return {
    accessToken,
    refreshToken,
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
    scope: json.scope ? String(json.scope) : null,
  };
}

async function postToken(cfg: OAuthConfig, body: URLSearchParams): Promise<TokenBundle> {
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body,
  });
  const json = (await res.json()) as Record<string, unknown>;
  // Slack's oauth.v2.access nests the user token; everything else is top-level.
  if (cfg.tokenUrl.includes("slack.com")) {
    const authed = (json.authed_user ?? {}) as Record<string, unknown>;
    return bundleFrom({ ...json, ...authed });
  }
  if (!res.ok || !json.access_token) {
    throw new Error(`token exchange failed (${res.status})`);
  }
  return bundleFrom(json);
}

/** Exchange an authorization code for a token bundle. */
export async function exchangeCodeForTokens(
  providerId: string,
  code: string,
  redirectUri: string,
): Promise<TokenBundle | null> {
  const cfg = CONFIGS[providerId];
  const id = cfg && clientId(cfg);
  const secret = cfg && clientSecret(cfg);
  if (!cfg || !id || !secret) return null;
  return postToken(
    cfg,
    new URLSearchParams({
      client_id: id,
      client_secret: secret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  ).catch(() => null);
}

/** Refresh an expired access token. Returns null if the provider issued no refresh token. */
export async function refreshTokens(
  providerId: string,
  refreshToken: string,
): Promise<TokenBundle | null> {
  const cfg = CONFIGS[providerId];
  const id = cfg && clientId(cfg);
  const secret = cfg && clientSecret(cfg);
  if (!cfg || !id || !secret) return null;
  const refreshed = await postToken(
    cfg,
    new URLSearchParams({
      client_id: id,
      client_secret: secret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  ).catch(() => null);
  // Providers often omit the refresh_token on refresh — carry the existing one forward.
  if (refreshed && !refreshed.refreshToken) refreshed.refreshToken = refreshToken;
  return refreshed;
}
