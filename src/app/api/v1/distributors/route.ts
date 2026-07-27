

import { NextRequest } from "next/server";
import { distributorController } from "@/modules/organization/controller";
import { handleApiError } from "@/lib/error-handler";

export const GET = async (req: NextRequest) => {
  try { return await distributorController.list(req); }
  catch (e) { return handleApiError(e); }
};

export const POST = async (req: NextRequest) => {
  try { return await distributorController.create(req); }
  catch (e) { return handleApiError(e); }
};

export const runtime = "nodejs";

