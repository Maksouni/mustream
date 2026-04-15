# mustream

Self-hosted music streaming: [Navidrome](https://www.navidrome.org/) and the React web player both run in Docker. The web container serves the built SPA and proxies `/rest` to Navidrome and `/api` to a small upload service so the browser uses one origin.

You can **upload audio files from the web app** (sidebar **Upload**). They are written to `music/uploads/` and a library scan is triggered via the Subsonic API. The upload service checks your Navidrome username and token on every request (same credentials as in **Settings**).

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (only if you want to run or rebuild the web app locally without Docker)

## Run everything (Docker)

1. Put audio files under `./music` (or change the bind mount in `docker-compose.yml`).
2. Start the stack:

   ```bash
   docker compose up -d --build
   ```

3. **Web player:** `http://localhost:8080` (or `http://LAN_IP:8080` from another device on your network) — in **Settings**, enter your Navidrome username and password. Leave **Base URL** empty so API calls go to the same host (`/rest` and `/api` are proxied).

   For **local dev** (`npm run dev`), start the stack so Navidrome and the **upload** service are reachable; the dev server proxies `/api` to `http://127.0.0.1:3000` (compose maps upload to **localhost only**).

4. **Navidrome UI** (first-time library folder and admin user): `http://127.0.0.1:4533` on the machine running Docker. From another PC, use an SSH tunnel, for example:

   ```bash
   ssh -L 4533:127.0.0.1:4533 user@your-server
   ```

   then open `http://127.0.0.1:4533` locally. Ensure `/music` is a music folder if the wizard asks.

Rebuild the web image after UI changes:

```bash
docker compose build web && docker compose up -d web
```

## Public HTTPS on VPS (`maxloud.ru`)

Use this for your VPS deployment at **`https://maxloud.ru`**. Checklist: **VPS with public IPv4** → **DNS A record for `maxloud.ru`** → **open TCP 80/443 on the server firewall/provider** → **Caddy** (Compose profile `https`) terminates TLS and proxies to `web`.

### 1. Confirm a reachable public IP

1. On the server: `curl -4 ifconfig.me` — note the address.
2. Ensure your DNS A record for `maxloud.ru` resolves to this exact IP.

### 2. Domain and DNS

1. Create/update an **A** record for root domain: `maxloud.ru` → **your VPS public IPv4**.
2. Wait for propagation and verify:

   ```bash
   dig +short maxloud.ru
   ```

### 3. Open required ports on VPS

1. Allow inbound **TCP 80** and **TCP 443** in cloud security group/provider firewall.
2. Allow the same ports in OS firewall (`ufw` / `firewalld`) if enabled.
3. Do **not** expose **4533** or **3000** publicly. In this stack they are bound to `127.0.0.1` only.

### 4. Configure `.env` and start with TLS

```bash
cp .env.example .env
# Edit .env:
# MUSTREAM_DOMAIN=maxloud.ru
# MUSTREAM_PUBLIC_URL=https://maxloud.ru
docker compose --profile https up -d --build
```

- **Caddy** ([`deploy/caddy/Caddyfile`](deploy/caddy/Caddyfile)) obtains **Let’s Encrypt** certificates (HTTP-01). The host must be reachable on **80** and **443** from the internet for issuance and renewal.
- **`MUSTREAM_PUBLIC_URL`** is passed to Navidrome as **`ND_BASEURL`** so links match how users open the site.

In the mustream **Settings** screen, keep **Base URL** empty (same origin as `https://maxloud.ru`).

### 5. Host firewall

Allow **22** (if you use SSH), **80**, and **443** from the internet as needed. Avoid exposing **4533** and **3000** on your public interface.

### 6. Checks

- Open `https://maxloud.ru` from an external network — certificate must be valid, app loads, playback and **Upload** work.
- If certificate issuance fails, verify DNS, firewall/security-group rules, and that nothing else uses 80/443 on the host.

To run **without** HTTPS (local / LAN only): use `docker compose up -d` **without** the `https` profile; Caddy will not start.

## Navidrome notes

### Environment variables (optional)

| Variable | Purpose |
|----------|---------|
| `ND_BASEURL` | Set via **`MUSTREAM_PUBLIC_URL`** in `.env` when using public HTTPS or Tailscale. |
| `ND_SCANSCHEDULE` | Library rescan interval (default in compose: `1h`). |

Data (database, cache) lives in the `navidrome_data` Docker volume. If the container cannot read `./music`, fix folder permissions or add `user: "${UID:-1000}:${GID:-1000}"` under the `navidrome` service (from a shell that exports `UID`/`GID`).

## Web app without Docker (development)

```bash
cd apps/web
npm install
npm run dev
```

Open `http://localhost:5173`. With Navidrome on `localhost:4533`, leave base URL empty (Vite proxies `/rest`) or set `http://localhost:4533`.

Production build only (static files in `dist/`):

```bash
npm run build
```

## Access over Tailscale (HTTPS, no purchased domain)

Use this when you want a **name + TLS** on your phone or laptop without opening router ports or buying a domain. Traffic stays inside your [tailnet](https://tailscale.com/kb/1136/tailnet/).

### 1. Install Tailscale on the same machine that runs Docker

Follow [Install Tailscale on Linux](https://tailscale.com/download/linux) (or your OS). Then:

```bash
sudo tailscale up
```

Sign in and finish device authorization in the admin console.

### 2. Enable MagicDNS

In the [Tailscale admin console](https://login.tailscale.com/admin/dns) → **DNS**, turn on **MagicDNS** so devices get short hostnames for each node.

### 3. Run mustream

```bash
docker compose up -d --build
```

The web UI on the host is `http://127.0.0.1:8080` (compose maps host `8080` → container `80`).

### 4. Expose the web UI with HTTPS (Tailscale Serve)

On **that same host** (not inside a container), run:

```bash
sudo tailscale serve --bg 127.0.0.1:8080
```

Check the URL Tailscale prints:

```bash
tailscale serve status
```

You should see an **HTTPS** URL like `https://your-machine.your-tailnet.ts.net` pointing at your local backend.

- **From another device:** install the Tailscale app, log into the **same** account, then open that **https://…** URL in the browser.
- In the mustream **Settings** screen, leave **Base URL** empty so the SPA uses the same origin (`/rest` and `/api` stay on that host).

### 5. Navidrome `ND_BASEURL` (recommended)

Put the **exact** HTTPS origin from `tailscale serve status` into `.env`:

```env
MUSTREAM_PUBLIC_URL=https://your-machine.your-tailnet.ts.net
```

Then:

```bash
docker compose up -d navidrome
```

(Compose applies `ND_BASEURL` from `MUSTREAM_PUBLIC_URL`.)

### Useful commands

| Command | Purpose |
|--------|---------|
| `tailscale serve status` | Show HTTPS URL and backend |
| `tailscale serve reset` | Remove all Serve configurations on this node |

Serve config with `--bg` survives reboots; if you remove it, run the `serve` command again.

## Security

Do not expose Navidrome or the web front to the internet without TLS and strong credentials. Prefer a VPN or a reverse proxy with HTTPS for remote access. **Tailscale** keeps services reachable only inside your tailnet unless you explicitly use [Funnel](https://tailscale.com/kb/1223/tailscale-funnel/). For a public domain, prefer **HTTPS only** (Caddy profile `https`) and do not publish Navidrome or the upload port directly.
