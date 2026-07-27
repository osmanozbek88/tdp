import { NextResponse } from "next/server";
import { prisma, getLogger } from "@/lib";

export const dynamic = "force-dynamic";

export async function GET() {
  const logger = getLogger();
  const start = performance.now();

  const checks: Record<string, "healthy" | "unhealthy"> = {};

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "healthy";
  } catch {
    checks.database = "unhealthy";
  }

  const duration = Math.round(performance.now() - start);
  const allHealthy = Object.values(checks).every((v) => v === "healthy");

  logger.info({ checks, durationMs: duration }, "Health check");

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      durationMs: duration,
      checks,
    },
    { status: allHealthy ? 200 : 503 },
  );
}
