import { NextRequest } from "next/server";
import { customerController } from "@/modules/organization/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const POST = withPermission("Employees.Edit", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return customerController.toggleStatus(req, { params });
});

export const runtime = "nodejs";
