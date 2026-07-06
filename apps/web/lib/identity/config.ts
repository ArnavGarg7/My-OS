/**
 * Client-side auth configuration flag. Mirrors the server's `isClerkConfigured`
 * using the public publishable key (inlined by Next at build). When false, the
 * app runs in local single-owner dev mode.
 */
export const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
