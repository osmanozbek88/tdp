import { NextRequest } from "next/server";
import { distributorController } from "@/modules/organization/controller";
import { handleApiError } from "@/lib/error-handler";

export const POST = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try { return await distributorController.toggleStatus(req, { params }); }
  catch (e) { return handleApiError(e); }
};

export const runtime = "nodejs";
