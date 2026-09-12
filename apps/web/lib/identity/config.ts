/**
 * Client-side auth configuration flags. Mirror the server's feature detection using the public,
 * build-inlined env vars. When neither backend is configured, the app runs in local single-owner
 * dev mode. Clerk takes precedence over Google when both are somehow set.
 */
export const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
export const googleAuthConfigured =
  !clerkConfigured && process.env.NEXT_PUBLIC_MYOS_GOOGLE_AUTH === "true";
