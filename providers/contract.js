const REQUIRED_METHODS = [
  "createSession",
  "closeSession",
  "navigate",
  "observe",
  "act",
  "screenshot",
  "goal",
];

export function assertProviderContract(provider) {
  if (!provider || typeof provider !== "object") {
    throw new Error("Browser provider must be an object");
  }

  if (typeof provider.name !== "string" || provider.name.length === 0) {
    throw new Error("Browser provider must expose a non-empty name");
  }

  for (const method of REQUIRED_METHODS) {
    if (typeof provider[method] !== "function") {
      throw new Error(
        `Browser provider "${provider.name}" is missing method "${method}"`
      );
    }
  }

  return provider;
}
