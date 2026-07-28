import { NextRequest } from "next/server";
import { distributorController } from "@/modules/organization/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const POST = withPermission("Distributors.Edit", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return distributorController.toggleStatus(req, { params });
});

export const runtime = "nodejs";
