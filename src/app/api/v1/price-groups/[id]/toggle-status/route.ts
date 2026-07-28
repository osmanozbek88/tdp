import { NextRequest } from "next/server";
import { priceGroupController } from "@/modules/organization/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const POST = withPermission("PriceGroups.Edit", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return priceGroupController.toggleStatus(req, { params });
});

export const runtime = "nodejs";
