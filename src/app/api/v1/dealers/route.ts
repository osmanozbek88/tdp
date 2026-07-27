import { NextRequest } from "next/server";
import { dealerController } from "@/modules/organization/controller";
import { handleApiError } from "@/lib/error-handler";

export const GET = async (req: NextRequest) => {
  try { return await dealerController.list(req); }
  catch (e) { return handleApiError(e); }
};

export const POST = async (req: NextRequest) => {
  try { return await dealerController.create(req); }
  catch (e) { return handleApiError(e); }
};

export const runtime = "nodejs";
