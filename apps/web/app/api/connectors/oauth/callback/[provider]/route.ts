import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/identity";
import { getDb } from "@/server/db";
import { exchangeCodeForTokens, publicBaseUrl, verifyState } from "@/server/connectors/oauth";
import { connectOAuth } from "@/server/connectors/service";

/**
 * OAuth callback (Stage B). The provider redirects here after consent. Verifies the signed CSRF
 * `state`, gates to the owner, exchanges the code for tokens, and stores the sealed bundle via the
 * connector service. Never surfaces the code or tokens — only a status in the redirect query. The
 * redirect_uri passed to the token exchange must match the one used at /start exactly.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const url = new URL(req.url);
  const base = publicBaseUrl(req);
  const done = (q: string) => NextResponse.redirect(`${base}/connectors?${q}`);

  const providerError = url.searchParams.get("error");
  if (providerError) return done(`error=${encodeURIComponent(providerError)}`);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!verifyState(state, provider)) return done("error=bad_state");
  if (!code) return done("error=no_code");

  await requireUser(); // only the owner completes the connection

  const redirectUri = `${base}/api/connectors/oauth/callback/${provider}`;
  const bundle = await exchangeCodeForTokens(provider, code, redirectUri);
  if (!bundle?.accessToken) return done("error=exchange_failed");

  const { db } = getDb();
  const result = await connectOAuth(db, provider, bundle);
  if (!result.ok) return done(`error=${result.error}`);
  return done(`connected=${encodeURIComponent(provider)}`);
}
