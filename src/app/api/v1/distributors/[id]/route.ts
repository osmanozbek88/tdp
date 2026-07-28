import { NextRequest } from "next/server";
import { distributorController } from "@/modules/organization/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const GET = withPermission("Distributors.View", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return distributorController.getById(req, { params });
});

export const PATCH = withPermission("Distributors.Edit", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return distributorController.update(req, { params });
});

export const DELETE = withPermission("Distributors.Delete", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return distributorController.delete(req, { params });
});

export const runtime = "nodejs";
