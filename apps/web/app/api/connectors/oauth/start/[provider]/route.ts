import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/server/identity";
import {
  buildAuthorizeUrl,
  oauthConfigured,
  publicBaseUrl,
  signState,
} from "@/server/connectors/oauth";

/**
 * OAuth start (Stage B). Owner-initiated: builds the provider's consent URL with a signed CSRF
 * `state` and redirects the browser to the provider. The redirect_uri is derived from the request
 * origin so it matches the callback the provider will hit (and what you registered in the app).
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  await requireUser(); // only the owner can initiate a connection
  const { provider } = await ctx.params;
  const base = publicBaseUrl(req);
  const backToConnectors = (err: string) =>
    NextResponse.redirect(`${base}/connectors?error=${err}`);

  if (!oauthConfigured(provider)) return backToConnectors("not_configured");

  const redirectUri = `${base}/api/connectors/oauth/callback/${provider}`;
  const url = buildAuthorizeUrl(provider, redirectUri, signState(provider));
  if (!url) return backToConnectors("not_configured");
  return NextResponse.redirect(url);
}
