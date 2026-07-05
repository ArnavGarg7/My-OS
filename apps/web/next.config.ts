import { existsSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

// Load the monorepo-root .env so server routes get DATABASE_URL etc. under
// `next dev` / `next start` (Next only auto-loads .env from the app directory).
const rootEnv = join(process.cwd(), "..", "..", ".env");
if (existsSync(rootEnv) && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(rootEnv);
}

// Standalone output for the Docker runtime image (infra/Dockerfile.web) only —
// the trace step symlinks node_modules, which Windows blocks (EPERM); local/CI
// builds don't need it. Applied via conditional spread to satisfy
// exactOptionalPropertyTypes (the `output` key is optional, not `| undefined`).
const standalone =
  process.env.MYOS_BUILD_STANDALONE === "1" ? { output: "standalone" as const } : {};

const config: NextConfig = {
  reactStrictMode: true,
  // Workspace packages export TypeScript source and are transpiled by Next.
  transpilePackages: ["@myos/ui", "@myos/shared", "@myos/core", "@myos/db", "@myos/ai"],
  // Linting is run separately via `turbo run lint` (do not block the build on it).
  eslint: { ignoreDuringBuilds: true },
  ...standalone,
};

export default config;
