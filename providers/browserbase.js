import { Stagehand } from "@browserbasehq/stagehand";

export class BrowserbaseProvider {
  name = "browserbase";

  config() {
    return {
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
    };
  }

  async createSession() {
    const stagehand = new Stagehand({
      env: "BROWSERBASE",
      ...this.config(),
      browserbaseSessionCreateParams: { keepAlive: true },
    });
    const { sessionId, sessionUrl } = await stagehand.init();
    return { session_id: sessionId, viewer_url: sessionUrl };
  }

  async closeSession(sessionId) {
    await this.withStagehand(sessionId, async (sh) => sh.page.close());
    return { ok: true };
  }

  async navigate(sessionId, { url }) {
    const title = await this.withStagehand(sessionId, async (sh) => {
      await sh.page.goto(url);
      return sh.page.title();
    });
    return { ok: true, title };
  }

  async observe(sessionId, { instruction }) {
    const observations = await this.withStagehand(sessionId, async (sh) =>
      sh.page.observe(instruction ? { instruction } : undefined)
    );
    return { observations };
  }

  async act(sessionId, { instruction }) {
    const result = await this.withStagehand(sessionId, async (sh) =>
      sh.page.act({ action: instruction })
    );
    return { ok: true, result };
  }

  async screenshot(sessionId, { full_page: fullPage = false }) {
    const buffer = await this.withStagehand(sessionId, async (sh) =>
      sh.page.screenshot({ fullPage })
    );
    return { image_base64: buffer.toString("base64"), full_page: fullPage };
  }

  async goal(sessionId, { goal, max_steps }) {
    const result = await this.withStagehand(sessionId, async (sh) => {
      const agent = sh.agent({ maxSteps: max_steps || 8 });
      return agent.execute(goal);
    });
    return { ok: true, result };
  }

  async withStagehand(sessionId, fn) {
    const stagehand = new Stagehand({
      env: "BROWSERBASE",
      ...this.config(),
      browserbaseSessionID: sessionId,
    });
    await stagehand.init();
    try {
      return await fn(stagehand);
    } finally {
      await stagehand.close();
    }
  }
}
