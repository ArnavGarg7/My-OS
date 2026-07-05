import "server-only";
import { parseServerEnv, type ServerEnv } from "@myos/shared/env";

let cached: ServerEnv | undefined;

/** Lazily validated server environment (parsed on first use, never at build). */
export function getEnv(): ServerEnv {
  return (cached ??= parseServerEnv());
}
