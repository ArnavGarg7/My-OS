# Cloudflare Tunnel — My OS remote access

Free, single-user public HTTPS access to My OS from **any browser**, with **no open inbound ports** and
**no client install** on your phone/laptop. Chosen over Tailscale because the requirement is "any
browser when I'm away from home" — Tailscale requires its client on every device, so it cannot serve an
arbitrary borrowed browser. See [../../docs/operations/remote-access.md](../../docs/operations/remote-access.md)
for the full comparison and step-by-step setup.

## Two ways to run the tunnel

The `cloudflared` service in `docker-compose.yml` uses the **token** method (simplest — nothing to mount):

1. Create a tunnel in the Cloudflare Zero Trust dashboard → Networks → Tunnels.
2. Add a **public hostname** (e.g. `myos.example.com`) routed to `http://caddy:80`.
3. Copy the tunnel **token** into `.env` as `MYOS_TUNNEL_TOKEN=...` (a secret — never commit it).
4. Start with the tunnel profile:
   ```
   docker compose -f infra/docker-compose.yml --profile tunnel up -d --build
   ```

## Alternative: credentials-file method

If you prefer a config file over a token, copy `config.example.yml` to `config.yml`, place your
`<TUNNEL_ID>.json` credentials next to it, and change the compose `command` to
`tunnel --no-autoupdate --config /etc/cloudflared/config.yml run`, mounting this directory to
`/etc/cloudflared`. Both `config.yml` and `*.json` are gitignored.

## Security

Put **Cloudflare Access** (free, in Zero Trust → Access → Applications) in front of the hostname so only
your email can reach it — this is a second gate on top of the app's own Clerk authentication. Details in
the remote-access guide.
