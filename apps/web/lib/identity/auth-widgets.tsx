"use client";

import Link from "next/link";
import { SignIn, SignUp } from "@clerk/nextjs";
import { Button, Card, Text } from "@myos/ui";
import { clerkConfigured } from "./config";

/**
 * Auth surface widgets. Render Clerk's hosted sign-in/up components when Clerk
 * is configured, otherwise a dev notice (there is no sign-in in local mode).
 * Isolating Clerk's `<SignIn/>`/`<SignUp/>` here keeps pages Clerk-free.
 */

function DevAuthNotice({ verb }: { verb: string }) {
  return (
    <Card className="w-full max-w-sm p-6 text-center">
      <Text variant="heading-s" className="mb-1">
        Authentication not configured
      </Text>
      <Text variant="body-s" className="text-fg-subtle mb-4">
        My OS is running in local single-owner mode, so there is no {verb} step. Add Clerk keys to
        enable Google / email sign-in.
      </Text>
      <Button asChild className="w-full">
        <Link href="/today">Continue to My OS</Link>
      </Button>
    </Card>
  );
}

export function AuthSignIn() {
  if (!clerkConfigured) return <DevAuthNotice verb="sign-in" />;
  return <SignIn />;
}

export function AuthSignUp() {
  if (!clerkConfigured) return <DevAuthNotice verb="sign-up" />;
  return <SignUp />;
}
