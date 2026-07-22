import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "./auth.service";
import { withApiHandler } from "@/lib";

const authService = new AuthService();

export const authController = {
  login: withApiHandler(async (_req: NextRequest) => {
    await authService.login("", "");
    return NextResponse.json({ message: "Login endpoint placeholder" });
  }),

  register: withApiHandler(async (_req: NextRequest) => {
    await authService.register({ email: "", password: "", firstName: "", lastName: "" });
    return NextResponse.json({ message: "Register endpoint placeholder" });
  }),

  me: withApiHandler(async (_req: NextRequest) => {
    return NextResponse.json({ message: "Me endpoint placeholder" });
  }),
};
