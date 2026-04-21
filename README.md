# Twoody Browser Agent

HTTP sidecar that drives browser sessions for Twoody.

The private Rails backend and the self-hosted local-server both talk to this
service over the same bearer-protected HTTP contract.

## Providers

Set `BROWSER_PROVIDER`:

- `browserbase` — cloud sessions through Browserbase + Stagehand. This is the
  production provider used by `api.twoody.com`.
- `playwright-local` — self-hosted Chromium on the user's machine. This is the
  zero-cloud provider for local-server installs.

## Run

```bash
cp .env.example .env
npm install
npm run dev
```

For the local Playwright provider, install Chromium once:

```bash
npx playwright install chromium
```

Health:

```bash
curl http://localhost:3100/health
```

## HTTP Contract

All routes except `/health` require:

```http
Authorization: Bearer <BROWSER_AGENT_SECRET>
```

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/health` | - | `{ok, provider}` |
| POST | `/v1/sessions` | - | `{session_id, viewer_url}` |
| DELETE | `/v1/sessions/:id` | - | `{ok}` |
| POST | `/v1/sessions/:id/navigate` | `{url}` | `{ok, title}` |
| POST | `/v1/sessions/:id/observe` | `{instruction?}` | `{observations}` |
| POST | `/v1/sessions/:id/act` | `{instruction}` | `{ok, result}` |
| POST | `/v1/sessions/:id/screenshot` | `{full_page?}` | `{image_base64, full_page}` |
| POST | `/v1/sessions/:id/goal` | `{goal, max_steps?}` | `{ok, result}` |

`observe`, `act`, and `goal` require Stagehand. The local Playwright provider
returns a clear `501` for those calls until a local Stagehand runner is wired.

## Provider Matrix

| Capability | `browserbase` | `playwright-local` |
|------------|---------------|--------------------|
| Create session | Yes | Yes |
| Navigate | Yes | Yes |
| Screenshot | Yes | Yes |
| Close session | Yes | Yes |
| Observe | Yes, Stagehand | Not yet, returns `501` |
| Act | Yes, Stagehand | Not yet, returns `501` |
| Goal agent loop | Yes, Stagehand | Not yet, returns `501` |

## Smoke Test

```bash
BROWSER_PROVIDER=playwright-local \
BROWSER_AGENT_SECRET=test \
BROWSER_AGENT_PORT=4310 \
node server.js

curl http://127.0.0.1:4310/health
curl -i -X POST http://127.0.0.1:4310/v1/sessions
curl -i -X POST -H 'Authorization: Bearer test' http://127.0.0.1:4310/v1/sessions
```

The last command requires the Playwright Chromium binary. If it has not been
installed yet, run:

```bash
npx playwright install chromium
```
