-- AlterTable
ALTER TABLE "Dealer" ADD COLUMN     "address" TEXT,
ADD COLUMN     "commissionRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "priceGroupId" TEXT;

-- AlterTable
ALTER TABLE "Distributor" ADD COLUMN     "address" TEXT,
ADD COLUMN     "commissionRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "priceGroupId" TEXT;

-- AlterTable
ALTER TABLE "SubDealer" ADD COLUMN     "address" TEXT,
ADD COLUMN     "commissionRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "priceGroupId" TEXT;

-- CreateTable
CREATE TABLE "PriceGroup" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "markupPercent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PriceGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceGroup_tenantId_name_key" ON "PriceGroup"("tenantId", "name");

-- AddForeignKey
ALTER TABLE "Distributor" ADD CONSTRAINT "Distributor_priceGroupId_fkey" FOREIGN KEY ("priceGroupId") REFERENCES "PriceGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dealer" ADD CONSTRAINT "Dealer_priceGroupId_fkey" FOREIGN KEY ("priceGroupId") REFERENCES "PriceGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubDealer" ADD CONSTRAINT "SubDealer_priceGroupId_fkey" FOREIGN KEY ("priceGroupId") REFERENCES "PriceGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceGroup" ADD CONSTRAINT "PriceGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
