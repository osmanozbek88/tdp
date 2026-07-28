import { NextRequest } from "next/server";
import { subDealerController } from "@/modules/organization/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const GET = withPermission("SubDealers.View", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return subDealerController.getById(req, { params });
});

export const PATCH = withPermission("SubDealers.Edit", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return subDealerController.update(req, { params });
});

export const DELETE = withPermission("SubDealers.Delete", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return subDealerController.delete(req, { params });
});

export const runtime = "nodejs";
