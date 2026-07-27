import { NextRequest } from "next/server";
import { subDealerController } from "@/modules/organization/controller";
import { handleApiError } from "@/lib/error-handler";

export const GET = async (req: NextRequest) => {
  try { return await subDealerController.list(req); }
  catch (e) { return handleApiError(e); }
};

export const POST = async (req: NextRequest) => {
  try { return await subDealerController.create(req); }
  catch (e) { return handleApiError(e); }
};

export const runtime = "nodejs";
