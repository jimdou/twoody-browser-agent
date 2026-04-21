# AGENTS.md - Twoody Browser Agent

## Purpose

`twoody-browser-agent` is the browser automation sidecar used by the private Rails backend and by self-hosted local-server installs. It exposes one bearer-protected HTTP contract and can run against Browserbase or a local Playwright Chromium.

## Providers

- `browserbase`: cloud browser sessions, production-oriented.
- `playwright-local`: self-hosted Chromium for local-server installs.

Both providers should satisfy the same browser session contract. The current
contract assertion lives in `providers/contract.js`, and `npm run smoke`
validates the local Playwright path end-to-end.

## Conventions

- Keep the HTTP API backend-agnostic.
- Do not depend on Rails internals or private backend code.
- Treat destructive actions and payment flows as consent-gated.
- Do not log page contents, form values, secrets, or bearer tokens.
- Keep Docker/Heroku deployment paths working independently.
- Keep the provider contract and the README's capability matrix in sync.
