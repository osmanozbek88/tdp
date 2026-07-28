import { NextRequest } from "next/server";
import { employeeController } from "@/modules/organization/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const POST = withPermission("Employees.Edit", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return employeeController.toggleStatus(req, { params });
});

export const runtime = "nodejs";
