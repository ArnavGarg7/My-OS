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
   docker compose --env-file .env -f infra/docker-compose.yml --profile tunnel up -d --build
   ```
   (`--env-file .env` makes the root `.env` available for the `NEXT_PUBLIC_*` build args — see the
   [deployment guide](deployment.md). `MYOS_APP_URL` is a runtime value, so changing it to your HTTPS
   origin does not require a rebuild; changing a `NEXT_PUBLIC_*` value does.)
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

## Alternative: public VM + DuckDNS (Caddy owns TLS, $0, no Cloudflare)

If you host on a public cloud VM (e.g. an Oracle Cloud Always-Free ARM instance) and want a strictly-
free setup with **no Cloudflare**, Caddy can terminate TLS itself against a free DuckDNS hostname. This
trades the Cloudflare Access email-gate for the app's own **Clerk** login, and it does require opening
two ports (unlike the tunnel).

1. **DuckDNS.** Create `myos.duckdns.org` at <https://www.duckdns.org> and point it at the VM's public
   IP. Keep it current with the DuckDNS cron updater (their install page gives a one-liner) so the record
   follows the VM.
2. **Open ports 80 + 443** in BOTH layers Oracle uses:
   - VCN **Security List** (or a Network Security Group): ingress Allow TCP 80 and 443 from `0.0.0.0/0`.
   - The instance's host firewall — Oracle images ship restrictive rules:
     ```
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
     sudo netfilter-persistent save        # Ubuntu; on Oracle Linux use firewall-cmd instead
     ```
3. **Auth = Clerk** (there is no edge gate here, so the URL is public until Clerk challenges it). Create a
   free app at <https://dashboard.clerk.com>, and set `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   in `.env`. Add `https://myos.duckdns.org` to Clerk's allowed origins. Leave `MYOS_SINGLE_OWNER` blank.
4. **Point Caddy at the hostname** in `.env`:
   ```
   MYOS_SITE_ADDRESS=myos.duckdns.org      # Caddy gets a Let's Encrypt cert automatically
   MYOS_HTTP_PORT=80                        # ACME challenge + 80→443 redirect
   MYOS_HTTPS_PORT=443
   MYOS_DOMAIN=myos.duckdns.org
   MYOS_APP_URL=https://myos.duckdns.org
   ```
5. **Start (no tunnel profile):**
   ```
   docker compose --env-file .env -f infra/docker-compose.yml up -d --build
   ```
   Caddy obtains the certificate on first boot (needs 80/443 reachable) and renews it automatically; the
   cert persists in the `caddy_data` volume. Open `https://myos.duckdns.org` from any device.

## DNS recommendation

Let Cloudflare manage the hostname's DNS (the tunnel wires up a proxied `CNAME` for you automatically
when you add the public hostname). No manual A/AAAA records, no dynamic-DNS needed — the tunnel is
outbound, so your home IP can change freely.
