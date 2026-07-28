import { NextRequest } from "next/server";
import { dealerController } from "@/modules/organization/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const GET = withPermission("Dealers.View", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return dealerController.getById(req, { params });
});

export const PATCH = withPermission("Dealers.Edit", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return dealerController.update(req, { params });
});

export const DELETE = withPermission("Dealers.Delete", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return dealerController.delete(req, { params });
});

export const runtime = "nodejs";
