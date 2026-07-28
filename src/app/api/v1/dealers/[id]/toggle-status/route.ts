import { NextRequest } from "next/server";
import { dealerController } from "@/modules/organization/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const POST = withPermission("Dealers.Edit", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return dealerController.toggleStatus(req, { params });
});

export const runtime = "nodejs";
