import { NextRequest } from "next/server";
import { customerController } from "@/modules/organization/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const GET = withPermission("Employees.View", async (req: NextRequest) => {
  return customerController.list(req);
});

export const POST = withPermission("Employees.Create", async (req: NextRequest) => {
  return customerController.create(req);
});

export const runtime = "nodejs";
