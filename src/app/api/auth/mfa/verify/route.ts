import { authController } from "@/modules/auth";

export const POST = authController.verifyMfa;
export const runtime = "nodejs";
