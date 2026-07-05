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

  // Auth (required once Stage 0 auth lands; optional during bootstrap)
  SESSION_SECRET: z.string().min(32).optional(),

  // AI providers (optional)
  ANTHROPIC_API_KEY: z.string().optional(),
  VOYAGE_API_KEY: z.string().optional(),

  // Web Push / VAPID (optional until Stage 4)
  MYOS_VAPID_PUBLIC_KEY: z.string().optional(),
  MYOS_VAPID_PRIVATE_KEY: z.string().optional(),
  MYOS_VAPID_SUBJECT: z.string().optional(),

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
  return parsed.data;
}

/** Feature flag: is the external AI layer configured? (06_AI_Architecture.md §1) */
export function isAiEnabled(env: Pick<ServerEnv, "ANTHROPIC_API_KEY">): boolean {
  return Boolean(env.ANTHROPIC_API_KEY);
}
