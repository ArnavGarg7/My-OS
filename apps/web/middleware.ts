import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Route protection (Sprint 1.5). Everything is protected except the public
 * surface (landing, auth pages, design showcase, health probe). When Clerk is
 * unconfigured (local dev), the middleware is a pass-through — the
 * IdentityService supplies the local owner instead.
 */
const clerkConfigured = Boolean(
  process.env.CLERK_SECRET_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/showcase(.*)",
  "/api/health(.*)",
]);

const enforced = clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export default clerkConfigured ? enforced : () => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next internals and static files; always run for API/tRPC routes.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
