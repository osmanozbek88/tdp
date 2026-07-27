import { NextRequest } from "next/server";
import { priceGroupController } from "@/modules/organization/controller";
import { handleApiError } from "@/lib/error-handler";

export const GET = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try { return await priceGroupController.getById(req, { params }); }
  catch (e) { return handleApiError(e); }
};

export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try { return await priceGroupController.update(req, { params }); }
  catch (e) { return handleApiError(e); }
};

export const runtime = "nodejs";
