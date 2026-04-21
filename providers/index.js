import { BrowserbaseProvider } from "./browserbase.js";
import { assertProviderContract } from "./contract.js";
import { PlaywrightLocalProvider } from "./playwrightLocal.js";

export function createProvider() {
  const name = process.env.BROWSER_PROVIDER || "browserbase";

  if (name === "browserbase") {
    return assertProviderContract(new BrowserbaseProvider());
  }
  if (name === "playwright-local") {
    return assertProviderContract(new PlaywrightLocalProvider());
  }

  throw new Error(
    `Unknown BROWSER_PROVIDER=${name}. Expected browserbase or playwright-local.`
  );
}
