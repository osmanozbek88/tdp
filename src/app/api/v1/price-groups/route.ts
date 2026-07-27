import { NextRequest } from "next/server";
import { priceGroupController } from "@/modules/organization/controller";
import { handleApiError } from "@/lib/error-handler";

export const GET = async (req: NextRequest) => {
  try { return await priceGroupController.list(req); }
  catch (e) { return handleApiError(e); }
};

export const POST = async (req: NextRequest) => {
  try { return await priceGroupController.create(req); }
  catch (e) { return handleApiError(e); }
};

export const runtime = "nodejs";
