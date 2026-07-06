/**
 * Client identity layer (Sprint 1.5). Feature code imports identity from here —
 * never `@clerk/*`.
 */
export { clerkConfigured } from "./config";
export { useIdentity, type IdentityContextValue } from "./context";
export { AuthShellProvider, IdentityBridge } from "./auth-provider";
export { AuthSignIn, AuthSignUp } from "./auth-widgets";
