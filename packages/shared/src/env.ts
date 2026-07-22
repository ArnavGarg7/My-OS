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
 * (04_System_Architecture.md §11). Optional AI / push / backup vars degrade
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

  // AI providers (optional). Server-side only — never exposed to the browser,
  // never logged. A provider activates only when its key is present; the Local
  // provider is always available as the offline fallback (Sprint 5.3).
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  VOYAGE_API_KEY: z.string().optional(),
  /** Secret used to encrypt provider_credentials at rest (Sprint 5.3). */
  MYOS_AI_CREDENTIALS_SECRET: z.string().optional(),
  /**
   * Secret used to encrypt connector_credentials at rest (Sprint 6.4). DISTINCT from the AI secret —
   * connector credentials are isolated from the AI subsystem and never reachable by any AI provider.
   * When absent, a deterministic dev key derives from it so offline connectors still work in CI.
   */
  MYOS_CONNECTOR_SECRET: z.string().optional(),

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
  return parsed.data;
}

/** Feature flag: is the external AI layer configured? (06_AI_Architecture.md §1) */
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

/** Feature flag: is Web Push configured (VAPID keys present)? (Sprint 1.7) */
export function isPushConfigured(
  env: Pick<ServerEnv, "MYOS_VAPID_PRIVATE_KEY" | "NEXT_PUBLIC_MYOS_VAPID_PUBLIC_KEY">,
): boolean {
  return Boolean(env.MYOS_VAPID_PRIVATE_KEY) && Boolean(env.NEXT_PUBLIC_MYOS_VAPID_PUBLIC_KEY);
}
