import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";

/** Typed tRPC React client (04 §4/§5). */
export const trpc = createTRPCReact<AppRouter>();

/** Inferred router output types, for typing component props off endpoint shapes. */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
