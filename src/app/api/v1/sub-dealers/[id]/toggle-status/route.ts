import { NextRequest } from "next/server";
import { subDealerController } from "@/modules/organization/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const POST = withPermission("SubDealers.Edit", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return subDealerController.toggleStatus(req, { params });
});

export const runtime = "nodejs";
