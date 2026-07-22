# Security Hardening Review (Workstream 9)

Security posture of the personal production deployment. Builds on the app-level
[v1.0.0 security review](../security/release-review-v1.0.0.md); this covers the **deployment** layer.
**Result: PASS** for a single-user self-hosted deployment.

| Area | Status | Notes |
| --- | --- | --- |
| HTTPS | ✅ | Cloudflare edge TLS for remote; Caddy ACME for a local real domain. No plaintext exposure remotely. |
| Reverse proxy | ✅ | Caddy is the only ingress; web/worker/postgres are never published directly. |
| Security headers | ✅ | HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `-Server` at Caddy. |
| Firewall | ✅ (rec.) | With the tunnel, **no inbound ports** need opening. Keep Windows Firewall default-deny inbound; don't port-forward 80/443 on your router. |
| Authentication | ✅ | Clerk (app) + optional **Cloudflare Access** email gate in front of the public URL = two layers. |
| Connector vault | ✅ | AES-256-GCM, server-only, never returned via API, never AI-reachable (`MYOS_CONNECTOR_SECRET`). |
| AI credentials | ✅ | Encrypted at rest (`MYOS_AI_CREDENTIALS_SECRET`); provider keys server-only; Local provider needs none. |
| Environment variables | ✅ | Validated (zod); secrets only in gitignored `.env`; tunnel token + Cloudflare creds gitignored. |
| Container isolation | ✅ | Services share a private compose network; only Caddy (and opt-in cloudflared) reach outside. |
| Least privilege | ✅ | Connectors read-first, least-privilege scopes; every tRPC route is `protectedProcedure`. |
| No secrets exposed | ✅ | Only `NEXT_PUBLIC_*` public tokens reach the client (Clerk publishable key, VAPID public key). |

## Recommended firewall posture

- **Do not** port-forward on your home router. The Cloudflare Tunnel is **outbound** — remote access
  needs zero open inbound ports. This is the single biggest security win of the chosen design.
- Keep **Windows Firewall** at its default (inbound blocked). Docker Desktop manages what it needs.
- For same-Wi-Fi LAN access without the tunnel, allow inbound 80/443 **only** on Private networks — or
  just use the tunnel everywhere and keep the firewall closed.

## Secrets discipline

- All secrets live in `.env` (gitignored) and the Cloudflare dashboard. Nothing secret is committed.
- The tunnel token (`MYOS_TUNNEL_TOKEN`) and any `infra/cloudflared/*.json` credentials are gitignored.
- Rotate secrets by editing `.env` + `docker compose up -d`. Rotating the vault secrets invalidates
  previously-encrypted connector/AI credentials (re-enter them) — see [Maintenance](maintenance.md).

## Residual, accepted risks (single-user context)

- **No API rate limiting** on the tRPC surface — acceptable: single owner, every route authenticated,
  Cloudflare Access in front when public. (Tracked app-side in
  [future-work](../release/future-work.md).)
- **App-side CSP** deferred (needs nonces + Clerk/PWA testing). Edge headers above cover the common
  cases (clickjacking, MIME sniffing, referrer leakage) meanwhile.
- **Availability = your machine.** Self-hosted by design; if the PC is off, the OS is offline until it's
  back. This is the ₹0/month trade-off, accepted per the sprint's constraints.
