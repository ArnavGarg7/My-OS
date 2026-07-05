import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers/_app";

/** Typed tRPC React client (04 §4/§5). */
export const trpc = createTRPCReact<AppRouter>();
