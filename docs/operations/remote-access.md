# Remote Access Guide

Reach My OS from your phone and from any browser away from home — free, secure, no open ports.

## The decision: Cloudflare Tunnel vs Tailscale

| Criterion | **Cloudflare Tunnel** (chosen) | Tailscale |
| --- | --- | --- |
| Cost | Free | Free (personal) |
| "Any browser away from home" | ✅ Yes — public HTTPS hostname, nothing to install | ❌ No — needs the Tailscale client on the device |
| Mobile support | ✅ Any mobile browser | ✅ But only devices running Tailscale |
| Security model | Public URL + **Cloudflare Access** (email gate) + app's Clerk auth | Private mesh (never public) — very strong |
| Open inbound ports | None (outbound tunnel) | None (mesh) |
| Simplicity | One container + a token | One client per device |
| Reliability | Cloudflare edge | Excellent |
| Maintenance | Minimal | Minimal |
| Performance | Edge-accelerated | Direct/relayed P2P |

**Chosen: Cloudflare Tunnel.** The explicit requirement is *"any browser when I'm away from home."* Only
Cloudflare Tunnel satisfies that — it publishes a real HTTPS hostname you can open on a borrowed laptop
or any phone browser without installing anything. Tailscale is arguably *more* private, but it can only
reach devices that run the Tailscale client, so it fails the "any browser" test.

> Prefer maximum privacy and only ever use your own devices? Tailscale is a great alternative: install
> it on the host and each device, then browse to the host's Tailscale IP:80. The app is unchanged; only
> this guide's networking differs. Everything below covers the chosen Cloudflare path.

## Cloudflare Tunnel setup

You need a free Cloudflare account and a domain on Cloudflare (a cheap domain, or a free subdomain you
control). Then:

1. **Create the tunnel.** Cloudflare **Zero Trust** dashboard → **Networks → Tunnels → Create a tunnel**
   → *Cloudflared* → name it `myos`.
2. **Add a public hostname.** In the tunnel's config, add a public hostname, e.g.
   `myos.yourdomain.com`, with service **`http://caddy:80`** (the tunnel container talks to Caddy inside
   the compose network).
3. **Copy the token.** Cloudflare shows a `cloudflared ... run --token eyJ...` command. Copy the token.
4. **Configure My OS.** In `.env`:
   ```
   MYOS_TUNNEL_TOKEN=eyJ...        # the tunnel token (secret — gitignored)
   MYOS_DOMAIN=myos.yourdomain.com
   MYOS_APP_URL=https://myos.yourdomain.com
   ```
5. **Start with the tunnel profile:**
   ```
   docker compose -f infra/docker-compose.yml --profile tunnel up -d --build
   ```
6. Open `https://myos.yourdomain.com` from anywhere.

Full details and the credentials-file alternative: [`infra/cloudflared/README.md`](../../infra/cloudflared/README.md).

## Secure it (do this)

Add a second gate so only **you** can reach the public URL, in front of the app's own Clerk login:

- Cloudflare **Zero Trust → Access → Applications → Add an application** → *Self-hosted* → domain
  `myos.yourdomain.com` → policy **Allow** where **email == your email**. Free for personal use.

Now: public URL → Cloudflare Access (your email) → Clerk sign-in → My OS. Two independent auth layers,
zero open ports on your machine.

## HTTPS & certificates

Cloudflare terminates TLS at its edge and issues/renews the certificate automatically — you manage
nothing. Internally, the tunnel forwards to Caddy over the private compose network. For a **local-only**
domain (no tunnel) Caddy issues its own certificate via ACME when `MYOS_DOMAIN` is a real name.

## DNS recommendation

Let Cloudflare manage the hostname's DNS (the tunnel wires up a proxied `CNAME` for you automatically
when you add the public hostname). No manual A/AAAA records, no dynamic-DNS needed — the tunnel is
outbound, so your home IP can change freely.
