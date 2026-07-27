-- CreateTable
CREATE TABLE "ProviderStatus" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'healthy',
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "uptimePercentage30d" DECIMAL(65,30) NOT NULL DEFAULT 99.99,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderStatus_pkey" PRIMARY KEY ("id")
);
