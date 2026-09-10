# Caddy drop-in directives (`conf.d/*.caddy`)

The main [`../Caddyfile`](../Caddyfile) ends its site block with `import /etc/caddy/conf.d/*.caddy`.
Any `*.caddy` file you place here is spliced into that block. An empty directory imports nothing (a glob
that matches no files is not an error), so the local and Cloudflare-Tunnel paths leave this empty.

## When you need it: the public-VM (DuckDNS) password gate

On a public cloud VM with no Cloudflare Access in front, `MYOS_SINGLE_OWNER=true` needs an external gate
so the URL isn't open to the world. A Caddy `basic_auth` block is that gate — the app then trusts every
request that clears it as the single owner.

1. Generate a bcrypt hash of your chosen password (run on the VM, Docker already installed):

   ```bash
   docker run --rm caddy:2-alpine caddy hash-password --plaintext 'your-strong-password'
   ```

   It prints a hash like `$2a$14$Lhq0…`.

2. Create `auth.caddy` in this directory (copy the example):

   ```
   basic_auth {
       owner $2a$14$Lhq0…the-hash-you-generated…
   }
   ```

   `owner` is the username you'll type at the browser prompt; the second field is the **hash**, never the
   plaintext. Keep the whole `$2a$…` string on one line.

3. Bring the stack up (or `docker compose … restart caddy` if already running). The browser will prompt
   for the username + password once and remember it — including after you install the PWA to your home
   screen.

`auth.caddy` is gitignored (it contains your credential hash); only this README and the `.example` are
tracked.
