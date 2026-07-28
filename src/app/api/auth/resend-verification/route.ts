import { authController } from "@/modules/auth";

export const POST = authController.resendVerification;
export const runtime = "nodejs";
