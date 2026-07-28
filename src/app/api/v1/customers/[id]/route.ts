import { NextRequest } from "next/server";
import { customerController } from "@/modules/organization/controller";
import { withPermission } from "@/lib/auth/with-permission";

export const GET = withPermission("Employees.View", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return customerController.getById(req, { params });
});

export const PATCH = withPermission("Employees.Edit", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return customerController.update(req, { params });
});

export const DELETE = withPermission("Employees.Delete", async (req: NextRequest, { params }: { params: { id: string } }) => {
  return customerController.delete(req, { params });
});

export const runtime = "nodejs";
