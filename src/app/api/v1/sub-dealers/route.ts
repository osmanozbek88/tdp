import { NextRequest } from "next/server";
import { subDealerController } from "@/modules/organization/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const GET = withPermission("SubDealers.View", async (req: NextRequest) => {
  return subDealerController.list(req);
});

export const POST = withPermission("SubDealers.Create", async (req: NextRequest) => {
  return subDealerController.create(req);
});

export const runtime = "nodejs";
