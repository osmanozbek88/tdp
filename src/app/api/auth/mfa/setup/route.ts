import { authController } from "@/modules/auth";

export const POST = authController.setupMfa;
export const runtime = "nodejs";
