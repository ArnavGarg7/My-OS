import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  HeartPulse,
  ListChecks,
  Sparkles,
  Timer,
  Wallet,
} from "lucide-react";
import { Button } from "@myos/ui";
import { APP_NAME, APP_TAGLINE } from "@myos/shared/constants";
import { clerkEnabled, getCurrentUser } from "@/server/identity";

export const dynamic = "force-dynamic";

/**
 * Public landing (Sprint 1.5; V2 aesthetic pass). Authenticated users are sent to
 * onboarding or their landing page; everyone else sees the entry point — a premium
 * Kinetic Obsidian hero over the ambient amber aurora. In local dev mode the owner is
 * always present, so this immediately forwards into the OS.
 */

/** The pillars the OS unifies — a real capability strip, not decoration. */
const PILLARS = [
  { icon: ListChecks, label: "Tasks & projects", blurb: "One prioritized queue, always current." },
  { icon: CalendarDays, label: "Calendar", blurb: "Your real schedule, merged and aware." },
  { icon: Timer, label: "Focus mode", blurb: "Deep work, credited back to the plan." },
  { icon: HeartPulse, label: "Health", blurb: "Sleep, recovery and readiness at a glance." },
  { icon: Wallet, label: "Finance", blurb: "Net worth, budgets and renewals in view." },
  { icon: Sparkles, label: "Chief of Staff", blurb: "A grounded AI that knows your day." },
] as const;

export default async function LandingPage() {
  const identity = await getCurrentUser();
  if (identity) {
    redirect(identity.isOnboarded ? "/home" : "/onboarding");
  }

  return (
    <main className="bg-base text-fg relative flex min-h-dvh flex-col overflow-hidden">
      <div className="myos-aurora" aria-hidden />
      <div className="myos-grid-tex" aria-hidden />

      <div className="relative z-[1] mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-6 py-8">
        {/* Brand row */}
        <header className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="bg-accent size-2.5 rounded-full shadow-[0_0_16px_var(--accent-muted)]"
          />
          <span className="text-caption text-fg-muted uppercase tracking-[0.28em]">{APP_NAME}</span>
        </header>

        {/* Hero */}
        <section className="myos-stagger flex flex-1 flex-col items-center justify-center gap-7 py-16 text-center">
          <span className="border-border bg-surface/70 text-fg-muted inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 backdrop-blur-sm">
            <span aria-hidden className="bg-success size-1.5 rounded-full" />
            <span className="text-caption tracking-wide">Your whole life, one calm surface</span>
          </span>

          <h1 className="text-display-xl max-w-3xl text-balance tracking-tight sm:text-5xl">
            {APP_TAGLINE.replace(/\.$/, "")}
            <span className="text-accent">.</span>
          </h1>

          <p className="text-body-l text-fg-muted max-w-xl text-pretty">
            Tasks, calendar, focus, health and finance stop living in ten different apps. My OS
            pulls them into one deterministic operating surface — and a Chief of Staff that always
            knows what matters next.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            {clerkEnabled() ? (
              <>
                <Button asChild size="lg">
                  <Link href="/sign-in">
                    Sign in
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/sign-up">Create account</Link>
                </Button>
              </>
            ) : (
              <Button asChild size="lg">
                <Link href="/home">
                  Enter {APP_NAME}
                  <ArrowRight size={16} aria-hidden />
                </Link>
              </Button>
            )}
          </div>
        </section>

        {/* Pillars — what's actually inside */}
        <section className="grid grid-cols-1 gap-3 pb-10 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map(({ icon: Icon, label, blurb }) => (
            <div
              key={label}
              className="myos-lift border-border bg-surface/60 shadow-e1 flex flex-col gap-2 rounded-2xl border p-4 backdrop-blur-sm"
            >
              <span className="bg-accent-muted border-accent-border text-accent-fg flex size-9 items-center justify-center rounded-xl border">
                <Icon size={18} aria-hidden />
              </span>
              <span className="text-body-s font-semibold">{label}</span>
              <span className="text-caption text-fg-subtle">{blurb}</span>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
