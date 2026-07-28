import { NextRequest } from "next/server";
import { dealerController } from "@/modules/organization/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const GET = withPermission("Dealers.View", async (req: NextRequest) => {
  return dealerController.list(req);
});

export const POST = withPermission("Dealers.Create", async (req: NextRequest) => {
  return dealerController.create(req);
});

export const runtime = "nodejs";
