# Avalon self-host deployment

This overlay adapts `Razdva122/avalon` for a portable Docker Compose deployment.

## What changed

- Adds a full production `docker-compose.yml` for MongoDB + backend + frontend.
- Adds `.env.example` for deployment-specific values.
- Removes the hard-coded production frontend origin from the backend.
- Removes the hard-coded `avalon-game.com` Socket.IO endpoint from the UI.
- Replaces the upstream domain/certificate-specific nginx config with a generic
  same-origin reverse proxy suitable for LAN access or an external reverse proxy.
- Keeps MongoDB and backend private to the Compose network; only the frontend
  HTTP port is published.

## Install into your fork

Copy this overlay into the root of your fork, preserving paths. It intentionally
replaces `ui.Dockerfile`, `packages/backend/src/const.ts`, and
`packages/ui/src/api/const.ts`.

Then:

```bash
cp .env.example .env
```

Edit `.env` and set at least:

- `FRONTEND_URL`
- `MONGODB_PASSWORD`
- `SECRET_KEY`

Generate secrets with:

```bash
openssl rand -hex 24
openssl rand -hex 32
```

Start:

```bash
docker compose up -d --build
```

Inspect:

```bash
docker compose ps
docker compose logs -f backend
```

By default the site is available at:

```text
http://SERVER_IP:8080
```

## LAN example

If the server is `192.168.1.50`, use:

```env
AVALON_PORT=8080
FRONTEND_URL=http://192.168.1.50:8080
```

Then rebuild/restart the backend after changing `.env`:

```bash
docker compose up -d
```

## Domain / reverse proxy example

If the public site is `https://avalon.example.com`, set:

```env
FRONTEND_URL=https://avalon.example.com
```

Point Caddy, Nginx Proxy Manager, Traefik, Cloudflare Tunnel, or another reverse
proxy at the host's Avalon frontend port (default `8080`). WebSocket support
must be enabled by the outer proxy.

TLS should normally terminate at the outer reverse proxy; the Avalon frontend
container itself only needs HTTP internally.

## Updating from upstream

Keep the original repository as an upstream remote:

```bash
git remote add upstream https://github.com/Razdva122/avalon.git
git fetch upstream
git merge upstream/master
```

The self-host changes are intentionally small so upstream merges should usually
be straightforward.

## Language routing customization

This overlay makes Simplified Chinese (`zh-CN`) the canonical default language:

- `/` -> Simplified Chinese
- `/wiki/` -> Simplified Chinese
- `/en/` -> English
- `/en/wiki/` -> English
- `/zh-tw/` -> Traditional Chinese
- `/ru/`, `/es/`, `/pt/` -> the existing additional translations
- legacy `/zh-cn/...` URLs redirect to the equivalent no-prefix Chinese URL

The URL is authoritative. A browser language or an old saved language preference
will not silently turn `/` into English. Internal navigation also preserves the
current prefixed language.

The upstream Discord/GitHub social buttons in the header and the corresponding
external links on the About page are removed.

## Upstream branding and analytics removal

The customization also removes upstream-specific external integrations that
should not be inherited by a private fork:

- Discord header link
- upstream GitHub header/About links
- Google Analytics tag
- Yandex Metrika tag
- Google/Yandex site-verification metadata

The production sitemap now uses `FRONTEND_URL` (passed into the UI build as
`SITE_URL`) rather than `https://avalon-game.com/`.
