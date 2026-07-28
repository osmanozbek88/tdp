import { NextRequest } from "next/server";
import { priceGroupController } from "@/modules/organization/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const GET = withPermission("PriceGroups.View", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return priceGroupController.getById(req, { params });
});

export const PATCH = withPermission("PriceGroups.Edit", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return priceGroupController.update(req, { params });
});

export const DELETE = withPermission("PriceGroups.Delete", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return priceGroupController.delete(req, { params });
});

export const runtime = "nodejs";
