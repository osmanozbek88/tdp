




import { getEnv } from "@/config/env";
import type { Provider } from "./provider-interface";
import { FakeProvider } from "./fake-provider";
import type { WebhookCallback } from "./fake-provider";
import { startProviderHealthChecks } from "./health-check";

let cachedProvider: Provider | null = null;
let healthCheckStarted = false;

/**
 * Get the active provider instance based on PROVIDER_TYPE env var.
 *
 * Supported values:
 *   - "fake"  → FakeProvider (default, for development/testing)
 *   - "telna" → TelnaProvider (not yet implemented)
 *
 * The provider is a singleton — created once and reused.
 * Starts provider health checks on first call.
 */
export async function getActiveProvider(
  webhookCallback?: WebhookCallback,
): Promise<Provider> {
  if (cachedProvider) return cachedProvider;

  const env = getEnv();
  const type = env.PROVIDER_TYPE;

  switch (type) {
    case "fake": {
      const provider = new FakeProvider(webhookCallback);
      cachedProvider = provider;
      break;
    }

    case "telna":
      throw new Error("Telna provider henüz implemente edilmedi (Faz 14)");

    default:
      throw new Error(
        `Bilinmeyen PROVIDER_TYPE: ${type}. "fake" veya "telna" olmalıdır.`,
      );
  }

  // Start health checks once on first provider init
  if (!healthCheckStarted) {
    healthCheckStarted = true;
    startProviderHealthChecks();
  }

  return cachedProvider!;
}

/**
 * Reset the cached provider instance (useful for testing or config changes).
 */
export function resetProvider(): void {
  cachedProvider = null;
}

/**
 * Override the provider instance (useful for testing).
 */
export function setProvider(provider: Provider): void {
  cachedProvider = provider;
}




