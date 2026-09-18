import { NextResponse, type NextRequest } from "next/server";
import { MOBILE_SESSION_COOKIE } from "@/lib/auth/mobile-session";

/**
 * Native-app sign-out (Stage D). Clears the httpOnly `myos_mobile_session` cookie so the WebView is no
 * longer authenticated. Called from inside the app; the app then navigates to the public landing. The
 * browser/PWA path continues to use NextAuth's own sign-out (this cookie only exists in the native app).
 */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<Response> {
  const secure =
    req.headers.get("x-forwarded-proto") === "https" || new URL(req.url).protocol === "https:";
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MOBILE_SESSION_COOKIE, "", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
