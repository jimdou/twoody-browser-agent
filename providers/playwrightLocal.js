import { chromium } from "playwright";

export class PlaywrightLocalProvider {
  name = "playwright-local";
  sessions = new Map();
  browserPromise = null;

  async createSession() {
    const browser = await this.browser();
    const context = await browser.newContext();
    const page = await context.newPage();
    const sessionId = crypto.randomUUID();

    this.sessions.set(sessionId, { context, page });

    return {
      session_id: sessionId,
      viewer_url: null,
    };
  }

  async closeSession(sessionId) {
    const session = this.requireSession(sessionId);
    await session.context.close();
    this.sessions.delete(sessionId);
    return { ok: true };
  }

  async navigate(sessionId, { url }) {
    const { page } = this.requireSession(sessionId);
    await page.goto(url);
    return { ok: true, title: await page.title() };
  }

  async observe() {
    return unsupportedStagehandFeature("observe");
  }

  async act() {
    return unsupportedStagehandFeature("act");
  }

  async screenshot(sessionId, { full_page: fullPage = false }) {
    const { page } = this.requireSession(sessionId);
    const buffer = await page.screenshot({ fullPage });
    return { image_base64: buffer.toString("base64"), full_page: fullPage };
  }

  async goal() {
    return unsupportedStagehandFeature("goal");
  }

  async browser() {
    if (!this.browserPromise) {
      this.browserPromise = chromium.launch({
        headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
      });
    }
    return this.browserPromise;
  }

  requireSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      const error = new Error(`Session ${sessionId} not found`);
      error.statusCode = 404;
      throw error;
    }
    return session;
  }
}

function unsupportedStagehandFeature(name) {
  const error = new Error(
    `${name} requires the browserbase provider until local Stagehand support is wired`
  );
  error.statusCode = 501;
  throw error;
}
