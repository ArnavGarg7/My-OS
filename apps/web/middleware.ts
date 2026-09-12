import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Route protection (Sprint 1.5; Google-auth stage). Everything is protected except the public surface
 * (landing, auth pages, design showcase, health probe, and the Auth.js endpoints). Backend is chosen by
 * env: Clerk if configured, else Google (Auth.js) when MYOS_GOOGLE_AUTH=true, else pass-through — in
 * which case IdentityService supplies the local single-owner instead.
 */
const clerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);
const googleAuthEnabled = !clerkConfigured && process.env.MYOS_GOOGLE_AUTH === "true";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/showcase(.*)",
  "/api/health(.*)",
  "/api/auth(.*)",
]);

const clerkEnforced = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) await auth.protect();
});

// Auth.js as middleware — gating comes from the `authorized` callback in auth.config.
const googleEnforced = NextAuth({ ...authConfig }).auth;

export default clerkConfigured
  ? clerkEnforced
  : googleAuthEnabled
    ? googleEnforced
    : () => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next internals and static files; always run for API/tRPC routes.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
