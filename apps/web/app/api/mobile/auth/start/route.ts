import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { publicBaseUrl } from "@/server/connectors/oauth";

/**
 * Native-app sign-in start (Stage D). The app opens this in the SYSTEM browser (Google blocks OAuth in
 * a WebView). If a browser session already exists, jump straight to the handoff; otherwise send the user
 * to the normal sign-in page with the handoff as the post-login callback. The handoff mints the one-time
 * token and deep-links back into the app.
 */
export const dynamic = "force-dynamic";

const HANDOFF = "/api/mobile/auth/handoff";

export async function GET(req: NextRequest): Promise<Response> {
  const session = await auth().catch(() => null);
  const base = publicBaseUrl(req);
  if (session?.user) {
    return NextResponse.redirect(new URL(HANDOFF, base));
  }
  return NextResponse.redirect(
    new URL(`/sign-in?callbackUrl=${encodeURIComponent(HANDOFF)}`, base),
  );
}
