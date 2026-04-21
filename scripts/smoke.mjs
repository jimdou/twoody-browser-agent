import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = process.env.BROWSER_AGENT_PORT || "4310";
const SECRET = process.env.BROWSER_AGENT_SECRET || "smoke-test-secret";
const BASE_URL = `http://127.0.0.1:${PORT}`;

const child = spawn("node", ["server.js"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    BROWSER_PROVIDER: process.env.BROWSER_PROVIDER || "playwright-local",
    BROWSER_AGENT_PORT: PORT,
    BROWSER_AGENT_SECRET: SECRET,
    PLAYWRIGHT_HEADLESS: process.env.PLAYWRIGHT_HEADLESS || "true",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let logs = "";

child.stdout.on("data", (chunk) => {
  logs += chunk.toString();
});

child.stderr.on("data", (chunk) => {
  logs += chunk.toString();
});

try {
  await waitForHealth();

  const session = await jsonFetch("/v1/sessions", {
    method: "POST",
    headers: authHeaders(),
  });

  if (!session.session_id) {
    throw new Error("Smoke test failed: missing session_id");
  }

  const navigation = await jsonFetch(`/v1/sessions/${session.session_id}/navigate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ url: "https://example.com" }),
  });

  if (!navigation.ok) {
    throw new Error("Smoke test failed: navigate did not return ok=true");
  }

  const screenshot = await jsonFetch(
    `/v1/sessions/${session.session_id}/screenshot`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ full_page: false }),
    }
  );

  if (!screenshot.image_base64 || screenshot.image_base64.length < 100) {
    throw new Error("Smoke test failed: screenshot payload looks empty");
  }

  const closed = await jsonFetch(`/v1/sessions/${session.session_id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!closed.ok) {
    throw new Error("Smoke test failed: close session did not return ok=true");
  }

  console.log("Twoody browser-agent smoke test passed");
} finally {
  child.kill("SIGTERM");
  await sleep(250);
}

async function waitForHealth() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (response.ok) {
        const payload = await response.json();
        if (payload.ok) return;
      }
    } catch (_error) {
      // The server is probably still booting.
    }
    await sleep(250);
  }

  throw new Error(`Smoke test failed: /health never became ready\n${logs}`);
}

async function jsonFetch(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(
      `Smoke test failed: ${options.method || "GET"} ${path} -> ${response.status} ${text}\n${logs}`
    );
  }

  return payload;
}

function authHeaders() {
  return {
    authorization: `Bearer ${SECRET}`,
    "content-type": "application/json",
  };
}
