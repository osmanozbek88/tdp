




import { getEnv } from "@/config/env";
import type { Provider } from "./provider-interface";
import { FakeProvider } from "./fake-provider";
import type { WebhookCallback } from "./fake-provider";

let cachedProvider: Provider | null = null;

/**
 * Get the active provider instance based on PROVIDER_TYPE env var.
 *
 * Supported values:
 *   - "fake"  → FakeProvider (default, for development/testing)
 *   - "telna" → TelnaProvider (not yet implemented)
 *
 * The provider is a singleton — created once and reused.
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
      return provider;
    }

    case "telna":
      throw new Error("Telna provider henüz implemente edilmedi (Faz 14)");

    default:
      throw new Error(
        `Bilinmeyen PROVIDER_TYPE: ${type}. "fake" veya "telna" olmalıdır.`,
      );
  }
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




