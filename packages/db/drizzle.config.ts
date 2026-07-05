import { defineConfig } from "drizzle-kit";
import { loadRootEnv, parseServerEnv } from "@myos/shared/env";

loadRootEnv();
const env = parseServerEnv();

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: { url: env.DATABASE_URL },
  strict: true,
  verbose: true,
});
