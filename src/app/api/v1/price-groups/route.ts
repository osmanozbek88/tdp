import { NextRequest } from "next/server";
import { priceGroupController } from "@/modules/organization/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const GET = withPermission("PriceGroups.View", async (req: NextRequest) => {
  return priceGroupController.list(req);
});

export const POST = withPermission("PriceGroups.Create", async (req: NextRequest) => {
  return priceGroupController.create(req);
});

export const runtime = "nodejs";
