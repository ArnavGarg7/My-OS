import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";

/**
 * Load the repository-root `.env` into process.env for standalone Node entrypoints
 * (worker, db CLIs). Walks up from `startDir` to the workspace root (marked by
 * pnpm-workspace.yaml). No-op when there is no `.env` (e.g. CI, which injects
 * env vars directly). Next.js loads `.env` on its own, so the web app doesn't
 * call this.
 */
export function loadRootEnv(startDir: string = process.cwd()): void {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) {
      const envPath = join(dir, ".env");
      if (existsSync(envPath) && typeof process.loadEnvFile === "function") {
        process.loadEnvFile(envPath);
      }
      return;
    }
    const parent = dirname(dir);
    if (parent === dir) return;
    dir = parent;
  }
}

/**
 * Server-side environment schema. Consumed at the app boundary by web + worker
 * (docs/specs/04_System_Architecture.md §11). Optional AI / push / backup vars degrade
 * gracefully when unset (NFR-9) — only DATABASE_URL is required to boot.
 */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Core
  DATABASE_URL: z.string().url(),
  MYOS_APP_URL: z.string().url().default("http://localhost:3000"),

  // Clerk (Sprint 1.5). Optional so the app builds/boots without them; when both
  // are present, authentication is enforced (see `isClerkConfigured`). Kept behind
  // the IdentityService abstraction — no app code reads these directly.
  CLERK_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default("/sign-in"),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default("/sign-up"),
  /**
   * Explicit opt-in to run the single-owner (no-Clerk) identity in PRODUCTION (O1 deployment).
   * By default the app refuses the local owner when NODE_ENV=production so an instance can never be
   * accidentally exposed without authentication. Set this to "true" ONLY when the origin is gated by an
   * external access layer (e.g. Cloudflare Access restricting it to the owner's email) — then the app
   * trusts every request as the single owner. Ignored whenever Clerk is configured (real auth always
   * wins). Has no effect outside production, where single-owner is already the default.
   */
  MYOS_SINGLE_OWNER: z.string().optional(),

  /**
   * Google sign-in (Auth.js) — the production identity backend for the self-hosted deploy (replaces
   * single-owner). "true" enables it; requires AUTH_SECRET + MYOS_GOOGLE_CLIENT_ID/SECRET. Ignored when
   * Clerk is configured (Clerk always wins). One Google OAuth app covers both sign-in and the Google
   * connector (Calendar/Gmail/Drive).
   */
  MYOS_GOOGLE_AUTH: z.string().optional(),
  /** Public mirror of MYOS_GOOGLE_AUTH, inlined into the client bundle at build time (like Clerk's key)
   *  so the browser knows to render Google sign-in. Set to the SAME value ("true"). */
  NEXT_PUBLIC_MYOS_GOOGLE_AUTH: z.string().optional(),
  /** Auth.js session/JWT encryption secret (required when MYOS_GOOGLE_AUTH=true). openssl rand -base64 33. */
  AUTH_SECRET: z.string().optional(),
  /** Comma-separated allowlist of Google emails permitted to sign in. Single-user: just your address.
   *  Empty while MYOS_GOOGLE_AUTH is on = nobody can sign in (fail-closed). */
  MYOS_OWNER_EMAILS: z.string().optional(),

  // AI providers (optional). Server-side only — never exposed to the browser,
  // never logged. A provider activates only when its key is present; the Local
  // provider is always available as the offline fallback (Sprint 5.3).
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  /** OpenWeather API key (Stage 9). Server-side only — powers the Weather connector's live fetch. */
  OPENWEATHER_API_KEY: z.string().optional(),
  VOYAGE_API_KEY: z.string().optional(),
  /** Secret used to encrypt provider_credentials at rest (Sprint 5.3). */
  MYOS_AI_CREDENTIALS_SECRET: z.string().optional(),
  /**
   * Secret used to encrypt connector_credentials at rest (Sprint 6.4). DISTINCT from the AI secret —
   * connector credentials are isolated from the AI subsystem and never reachable by any AI provider.
   * When absent, a deterministic dev key derives from it so offline connectors still work in CI.
   */
  MYOS_CONNECTOR_SECRET: z.string().optional(),
  /**
   * Data-at-rest encryption key (Stage C, Tier 1). Encrypts `private` free-text bodies
   * (journal/notes/inbox/messages/memories) at rest via the `encryptedText` column type —
   * distinct from the credential secrets. ⚠️ Back this up SEPARATELY from the database: lose
   * it and the encrypted bodies are unrecoverable. When absent, a deterministic dev key keeps
   * local/CI working (never a real secret).
   */
  MYOS_DATA_ENCRYPTION_KEY: z.string().optional(),
  /**
   * Live connector OAuth app credentials (Stage B). Server-side ONLY — never NEXT_PUBLIC_.
   * Presence of a CLIENT_ID flips that provider to live-available (see connectors/capabilities);
   * the CLIENT_SECRET is used server-side in the token exchange/refresh. Blank = sample mode.
   * One Google app covers Calendar + Gmail + Drive.
   */
  MYOS_GOOGLE_CLIENT_ID: z.string().optional(),
  MYOS_GOOGLE_CLIENT_SECRET: z.string().optional(),
  MYOS_GITHUB_CLIENT_ID: z.string().optional(),
  MYOS_GITHUB_CLIENT_SECRET: z.string().optional(),
  MYOS_SLACK_CLIENT_ID: z.string().optional(),
  MYOS_SLACK_CLIENT_SECRET: z.string().optional(),
  /**
   * Shared secret authorizing the worker's always-on proactive evaluation tick to call the
   * web app's internal endpoint (Stage 6). When absent, the internal route is disabled (503)
   * and the worker does NOT schedule the cron — proactivity then runs only via the in-app
   * `proactive.evaluate` trigger. Set it (plus MYOS_APP_URL) to enable true always-on.
   */
  MYOS_INTERNAL_SECRET: z.string().optional(),
  /** Cron for the always-on proactive evaluation tick (default every 15 minutes). */
  PROACTIVE_EVAL_CRON: z.string().default("*/15 * * * *"),
  /** Cron for background sync of live connectors (Stage B; default every 15 minutes). */
  CONNECTOR_SYNC_CRON: z.string().default("*/15 * * * *"),

  // Web Push / VAPID (optional until Stage 4). The public key is also exposed to
  // the browser (NEXT_PUBLIC_) so the client can create a push subscription.
  MYOS_VAPID_PUBLIC_KEY: z.string().optional(),
  MYOS_VAPID_PRIVATE_KEY: z.string().optional(),
  MYOS_VAPID_SUBJECT: z.string().optional(),
  NEXT_PUBLIC_MYOS_VAPID_PUBLIC_KEY: z.string().optional(),

  // Backups (optional)
  MYOS_BACKUP_S3_ENDPOINT: z.string().optional(),
  MYOS_BACKUP_S3_BUCKET: z.string().optional(),
  MYOS_BACKUP_S3_ACCESS_KEY: z.string().optional(),
  MYOS_BACKUP_S3_SECRET_KEY: z.string().optional(),
  MYOS_BACKUP_AGE_PUBLIC_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Parse + validate environment. Throws a readable aggregated error on failure
 * so a misconfigured deploy fails fast and loud rather than at first query.
 */
export function parseServerEnv(
  source: Record<string, string | undefined> = process.env,
): ServerEnv {
  // Treat empty strings as unset (a blank line in .env means "not configured",
  // not "present but invalid"), so optional vars stay optional.
  const cleaned: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(source)) {
    cleaned[key] = value === "" ? undefined : value;
  }
  const parsed = serverEnvSchema.safeParse(cleaned);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  // A half-configured Clerk (one key without the other) is a misconfiguration,
  // not an intentional "auth disabled" state — fail loudly.
  const { CLERK_SECRET_KEY: secret, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: pub } = parsed.data;
  if (Boolean(secret) !== Boolean(pub)) {
    throw new Error(
      "Invalid environment variables:\n  - Clerk: set BOTH CLERK_SECRET_KEY and " +
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, or neither.",
    );
  }
  // Google sign-in enabled but missing its prerequisites — fail loudly rather than silently locking
  // everyone out at first request.
  if (parsed.data.MYOS_GOOGLE_AUTH === "true" && !secret) {
    const missing: string[] = [];
    if (!parsed.data.AUTH_SECRET) missing.push("AUTH_SECRET");
    if (!parsed.data.MYOS_GOOGLE_CLIENT_ID) missing.push("MYOS_GOOGLE_CLIENT_ID");
    if (!parsed.data.MYOS_GOOGLE_CLIENT_SECRET) missing.push("MYOS_GOOGLE_CLIENT_SECRET");
    if (missing.length > 0) {
      throw new Error(
        `Invalid environment variables:\n  - Google sign-in (MYOS_GOOGLE_AUTH=true) requires: ${missing.join(", ")}.`,
      );
    }
  }
  return parsed.data;
}

/** Feature flag: is the external AI layer configured? (docs/specs/06_AI_Architecture.md §1) */
export function isAiEnabled(env: Pick<ServerEnv, "ANTHROPIC_API_KEY">): boolean {
  return Boolean(env.ANTHROPIC_API_KEY);
}

/**
 * Feature flag: is Clerk authentication configured? When false, the app runs in
 * a local single-owner dev mode (never in production — see IdentityService).
 */
export function isClerkConfigured(
  env: Pick<ServerEnv, "CLERK_SECRET_KEY" | "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY">,
): boolean {
  return Boolean(env.CLERK_SECRET_KEY) && Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
}

/**
 * Feature flag: is the app allowed to run the single-owner (no-Clerk) identity in production?
 * True only when `MYOS_SINGLE_OWNER` is explicitly "true" AND Clerk is not configured — an instance
 * gated by an external access layer (Cloudflare Access). Real Clerk auth always takes precedence.
 */
export function isSingleOwnerMode(
  env: Pick<
    ServerEnv,
    "MYOS_SINGLE_OWNER" | "CLERK_SECRET_KEY" | "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
  >,
): boolean {
  return env.MYOS_SINGLE_OWNER === "true" && !isClerkConfigured(env);
}

/**
 * Feature flag: is Google (Auth.js) sign-in the active identity backend? True only when
 * MYOS_GOOGLE_AUTH="true" with AUTH_SECRET + the Google OAuth app credentials present, and Clerk is not
 * configured (Clerk always wins). This is the production gate for the self-hosted deploy.
 */
export function isGoogleAuthConfigured(
  env: Pick<
    ServerEnv,
    | "MYOS_GOOGLE_AUTH"
    | "AUTH_SECRET"
    | "MYOS_GOOGLE_CLIENT_ID"
    | "MYOS_GOOGLE_CLIENT_SECRET"
    | "CLERK_SECRET_KEY"
    | "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
  >,
): boolean {
  return (
    env.MYOS_GOOGLE_AUTH === "true" &&
    Boolean(env.AUTH_SECRET) &&
    Boolean(env.MYOS_GOOGLE_CLIENT_ID) &&
    Boolean(env.MYOS_GOOGLE_CLIENT_SECRET) &&
    !isClerkConfigured(env)
  );
}

/** The Google emails permitted to sign in (lower-cased, trimmed). Empty = nobody (fail-closed). */
export function ownerEmailAllowlist(env: Pick<ServerEnv, "MYOS_OWNER_EMAILS">): string[] {
  return (env.MYOS_OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** Feature flag: is Web Push configured (VAPID keys present)? (Sprint 1.7) */
export function isPushConfigured(
  env: Pick<ServerEnv, "MYOS_VAPID_PRIVATE_KEY" | "NEXT_PUBLIC_MYOS_VAPID_PUBLIC_KEY">,
): boolean {
  return Boolean(env.MYOS_VAPID_PRIVATE_KEY) && Boolean(env.NEXT_PUBLIC_MYOS_VAPID_PUBLIC_KEY);
}
