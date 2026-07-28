import { NextRequest } from "next/server";
import { distributorController } from "@/modules/organization/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const GET = withPermission("Distributors.View", async (req: NextRequest) => {
  return distributorController.list(req);
});

export const POST = withPermission("Distributors.Create", async (req: NextRequest) => {
  return distributorController.create(req);
});

export const runtime = "nodejs";
