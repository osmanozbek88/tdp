
import { getLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { getActiveProvider } from "./factory";

const logger = getLogger().child({ module: "provider-health-check" });

let intervalHandle: ReturnType<typeof setInterval> | null = null;
const CHECK_INTERVAL_MS = 30_000;
const HISTORY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Run a single health check against the active provider and persist
 * the result to the ProviderStatus table.
 */
async function runHealthCheck(): Promise<void> {
  const start = performance.now();
  let status: "healthy" | "degraded" | "down" = "healthy";

  try {
    const provider = await getActiveProvider();
    await provider.fetchPlans();
    // Healthy if we got plans without error
  } catch {
    status = "degraded";
  }

  const latencyMs = Math.round(performance.now() - start);

  try {
    // Calculate 30-day uptime from stored checks
    const totalChecks30d = await prisma.providerStatus.count({
      where: { createdAt: { gte: new Date(Date.now() - HISTORY_WINDOW_MS) } },
    });
    const healthyChecks30d = await prisma.providerStatus.count({
      where: {
        status: "healthy",
        createdAt: { gte: new Date(Date.now() - HISTORY_WINDOW_MS) },
      },
    });

    const uptimePercentage30d =
      totalChecks30d > 0
        ? (healthyChecks30d / totalChecks30d) * 100
        : 99.99;

    await prisma.providerStatus.create({
      data: {
        status,
        latencyMs,
        uptimePercentage30d,
      },
    });

    if (status !== "healthy") {
      logger.warn({ status, latencyMs }, "Provider health check completed — NOT healthy");
    }
  } catch (err) {
    logger.error({ err }, "Failed to persist health check result");
  }
}

/**
 * Start periodic provider health checks.
 * Called once at application startup.
 */
export function startProviderHealthChecks(): void {
  if (intervalHandle) {
    logger.warn("Health check already running, skipping");
    return;
  }

  logger.info({ intervalMs: CHECK_INTERVAL_MS }, "Starting provider health checks");

  // Run immediately on startup
  runHealthCheck().catch(() => {});

  // Then periodically
  intervalHandle = setInterval(() => {
    runHealthCheck().catch(() => {});
  }, CHECK_INTERVAL_MS);
}

/**
 * Stop periodic health checks (for graceful shutdown).
 */
export function stopProviderHealthChecks(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    logger.info("Provider health checks stopped");
  }
}
