"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SignIn, SignUp } from "@clerk/nextjs";
import { signIn } from "next-auth/react";
import { Button, Card, Text } from "@myos/ui";
import { clerkConfigured, googleAuthConfigured } from "./config";

/**
 * Auth surface widgets. Render the active backend's sign-in UI — Clerk's hosted components, an Auth.js
 * "Continue with Google" button, or a dev notice in local single-owner mode. Isolating each backend's
 * sign-in call here keeps pages backend-free.
 */

function DevAuthNotice({ verb }: { verb: string }) {
  return (
    <Card className="w-full max-w-sm p-6 text-center">
      <Text asChild variant="heading-s" className="mb-1">
        <h1>Authentication not configured</h1>
      </Text>
      <Text asChild variant="body-s" className="text-fg-subtle mb-4">
        <p>
          My OS is running in local single-owner mode, so there is no {verb} step. Configure Google
          sign-in (or Clerk) to enable authenticated access.
        </p>
      </Text>
      <Button asChild className="w-full">
        <Link href="/today">Continue to My OS</Link>
      </Button>
    </Card>
  );
}

function GoogleSignIn() {
  const params = useSearchParams();
  // Honour a same-origin callbackUrl (the native app routes sign-in through /api/mobile/auth/handoff);
  // default to /home. Auth.js already restricts the callback to the same origin.
  const raw = params.get("callbackUrl");
  const callbackUrl = raw && raw.startsWith("/") ? raw : "/home";
  return (
    <Card className="w-full max-w-sm p-6 text-center">
      <Text asChild variant="heading-s" className="mb-1">
        <h1>Welcome to My OS</h1>
      </Text>
      <Text asChild variant="body-s" className="text-fg-subtle mb-5">
        <p>Sign in with your Google account to continue.</p>
      </Text>
      <Button className="w-full" onClick={() => void signIn("google", { callbackUrl })}>
        Continue with Google
      </Button>
    </Card>
  );
}

export function AuthSignIn() {
  if (clerkConfigured) return <SignIn />;
  // GoogleSignIn reads useSearchParams — wrap in Suspense so the page still prerenders.
  if (googleAuthConfigured)
    return (
      <Suspense fallback={null}>
        <GoogleSignIn />
      </Suspense>
    );
  return <DevAuthNotice verb="sign-in" />;
}

export function AuthSignUp() {
  if (clerkConfigured) return <SignUp />;
  // Google is invite-by-allowlist: there is no separate sign-up, the same button signs in.
  if (googleAuthConfigured)
    return (
      <Suspense fallback={null}>
        <GoogleSignIn />
      </Suspense>
    );
  return <DevAuthNotice verb="sign-up" />;
}
