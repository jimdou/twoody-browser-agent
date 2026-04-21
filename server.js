// Twoody Browser — browser automation sidecar.
//
// Providers:
//   BROWSER_PROVIDER=browserbase       Browserbase + Stagehand
//   BROWSER_PROVIDER=playwright-local  local Chromium via Playwright

import express from "express";
import { createProvider } from "./providers/index.js";

const app = express();
const provider = createProvider();

app.use(express.json({ limit: "2mb" }));

const PORT = parseInt(
  process.env.PORT || process.env.BROWSER_AGENT_PORT || "3100",
  10
);
const SECRET = process.env.BROWSER_AGENT_SECRET;

function requireAuth(req, res, next) {
  const header = req.header("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!SECRET || token !== SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

function asyncRoute(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || "Unknown error" });
    }
  };
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, provider: provider.name });
});

app.post(
  "/v1/sessions",
  requireAuth,
  asyncRoute(async (_req, res) => {
    res.json(await provider.createSession());
  })
);

app.delete(
  "/v1/sessions/:id",
  requireAuth,
  asyncRoute(async (req, res) => {
    res.json(await provider.closeSession(req.params.id));
  })
);

app.post(
  "/v1/sessions/:id/navigate",
  requireAuth,
  asyncRoute(async (req, res) => {
    res.json(await provider.navigate(req.params.id, req.body || {}));
  })
);

app.post(
  "/v1/sessions/:id/observe",
  requireAuth,
  asyncRoute(async (req, res) => {
    res.json(await provider.observe(req.params.id, req.body || {}));
  })
);

app.post(
  "/v1/sessions/:id/act",
  requireAuth,
  asyncRoute(async (req, res) => {
    res.json(await provider.act(req.params.id, req.body || {}));
  })
);

app.post(
  "/v1/sessions/:id/screenshot",
  requireAuth,
  asyncRoute(async (req, res) => {
    res.json(await provider.screenshot(req.params.id, req.body || {}));
  })
);

app.post(
  "/v1/sessions/:id/goal",
  requireAuth,
  asyncRoute(async (req, res) => {
    res.json(await provider.goal(req.params.id, req.body || {}));
  })
);

const missing = [
  "BROWSER_AGENT_SECRET",
  ...(provider.name === "browserbase"
    ? [
        "BROWSERBASE_API_KEY",
        "BROWSERBASE_PROJECT_ID",
        "OPENAI_API_KEY",
      ]
    : []),
].filter((key) => !process.env[key]);

if (missing.length) {
  console.warn(
    `[twoody-browser] MISSING ENV: ${missing.join(", ")} — protected calls will fail until set.`
  );
}

app.listen(PORT, () => {
  console.log(`[twoody-browser] ${provider.name} listening on :${PORT}`);
});
