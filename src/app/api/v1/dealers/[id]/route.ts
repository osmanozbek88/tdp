import { NextRequest } from "next/server";
import { dealerController } from "@/modules/organization/controller";
import { handleApiError } from "@/lib/error-handler";

export const GET = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try { return await dealerController.getById(req, { params }); }
  catch (e) { return handleApiError(e); }
};

export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try { return await dealerController.update(req, { params }); }
  catch (e) { return handleApiError(e); }
};

export const runtime = "nodejs";
