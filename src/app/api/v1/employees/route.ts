import { NextRequest } from "next/server";
import { employeeController } from "@/modules/organization/controller";
import { handleApiError } from "@/lib/error-handler";

export const GET = async (req: NextRequest) => {
  try { return await employeeController.list(req); }
  catch (e) { return handleApiError(e); }
};

export const POST = async (req: NextRequest) => {
  try { return await employeeController.create(req); }
  catch (e) { return handleApiError(e); }
};

export const runtime = "nodejs";
