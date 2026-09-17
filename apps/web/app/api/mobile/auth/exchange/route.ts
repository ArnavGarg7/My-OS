import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/server/db";
import { getEnv } from "@/server/env";
import { consumeOneTimeToken } from "@/server/identity/mobile";
import {
  MOBILE_SESSION_COOKIE,
  MOBILE_SESSION_TTL_MS,
  signMobileSession,
} from "@/lib/auth/mobile-session";

/**
 * Native-app session exchange (Stage D). Called from INSIDE the WebView with the one-time token from the
 * deep link, so the `Set-Cookie` lands in the WebView's own cookie jar. Consumes the token (single-use)
 * and issues the httpOnly mobile-session cookie; the app then reloads and is authenticated. Returns JSON
 * so the caller can react, but the session is carried entirely by the cookie.
 */
export const dynamic = "force-dynamic";

async function handle(req: NextRequest, token: string | null): Promise<Response> {
  if (!token) return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });

  const email = await consumeOneTimeToken(getDb().db, token).catch(() => null);
  if (!email) return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });

  const secret = getEnv().AUTH_SECRET ?? "";
  if (!secret) return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });

  const value = await signMobileSession(email, secret);
  const secure =
    req.headers.get("x-forwarded-proto") === "https" || new URL(req.url).protocol === "https:";

  const res = NextResponse.json({ ok: true });
  res.cookies.set(MOBILE_SESSION_COOKIE, value, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(MOBILE_SESSION_TTL_MS / 1000),
  });
  return res;
}

export async function POST(req: NextRequest): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as { token?: string };
  return handle(req, body.token ?? null);
}

export async function GET(req: NextRequest): Promise<Response> {
  return handle(req, new URL(req.url).searchParams.get("token"));
}
