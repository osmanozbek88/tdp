import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { verifyToken, verifyRefreshToken } from "@/lib/auth/jwt";
import { sendSuccess, sendNoContent } from "@/lib/response";
import { handleApiError } from "@/lib/error-handler";

const authService = new AuthService();

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(1, "Şifre gereklidir"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token gereklidir"),
  newPassword: z.string().min(8, "Şifre en az 8 karakter olmalıdır"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token gereklidir"),
});

const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

const mfaSetupSchema = z.object({
  method: z.enum(["TOTP", "EMAIL"]),
});

const mfaVerifySchema = z.object({
  code: z.string().length(6, "MFA kodu 6 haneli olmalıdır"),
});

function setRefreshCookie(response: NextResponse, token: string): void {
  response.cookies.set("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

function setAccessCookie(response: NextResponse, token: string): void {
  response.cookies.set("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
}

async function extractUserId(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw { statusCode: 401, code: "UNAUTHORIZED", message: "Kimlik doğrulaması gerekli" };
  }
  const token = authHeader.slice(7);
  const payload = await verifyToken(token);
  return payload.sub;
}

export const authController = {
  // ─── Login ───

  login: async (req: NextRequest) => {
    try {
      const body = await req.json();
      const parsed = loginSchema.parse(body);
      const result = await authService.login(parsed.email, parsed.password);
      const response = sendSuccess(result);
      setAccessCookie(response, result.accessToken);
      setRefreshCookie(response, result.refreshToken);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ─── Logout ───

  logout: async (req: NextRequest) => {
    try {
      // Try to parse body optionally, but always clear cookies
      let refreshToken: string | undefined;
      try {
        const body = await req.json();
        const parsed = logoutSchema.parse(body);
        refreshToken = parsed.refreshToken;
      } catch {
        // body parsing failed, that's fine
      }

      // Also try to get token from cookie if not in body
      if (!refreshToken) {
        refreshToken = req.cookies.get("refreshToken")?.value;
      }

      if (refreshToken) {
        try {
          const payload = await verifyRefreshToken(refreshToken);
          await authService.logout(payload.sub, payload.jti);
        } catch {
          // invalid token is still a successful logout
        }
      }

      const response = NextResponse.json({ success: true, data: { message: "Çıkış başarılı" } });
      response.cookies.set("accessToken", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      response.cookies.set("refreshToken", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ─── Refresh ───

  refresh: async (req: NextRequest) => {
    try {
      const body = await req.json();
      const parsed = refreshSchema.parse(body);
      const result = await authService.refresh(parsed.refreshToken);
      const response = sendSuccess(result);
      setAccessCookie(response, result.accessToken);
      setRefreshCookie(response, result.refreshToken);
      return response;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ─── Forgot Password ───

  forgotPassword: async (req: NextRequest) => {
    try {
      const body = await req.json();
      const parsed = forgotPasswordSchema.parse(body);
      await authService.forgotPassword(parsed.email);
      return NextResponse.json(
        sendSuccess({
          message:
            "Eğer bu e-posta sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderilmiştir.",
        }),
      );
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ─── Reset Password ───

  resetPassword: async (req: NextRequest) => {
    try {
      const body = await req.json();
      const parsed = resetPasswordSchema.parse(body);
      await authService.resetPassword(parsed.token, parsed.newPassword);
      return NextResponse.json(
        sendSuccess({ message: "Şifreniz başarıyla sıfırlandı." }),
      );
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ─── Verify Email ───

  verifyEmail: async (req: NextRequest) => {
    try {
      const url = new URL(req.url);
      const token = url.searchParams.get("token");
      if (!token) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "BAD_REQUEST", message: "Token parametresi gerekli" },
          },
          { status: 400 },
        );
      }
      await authService.verifyEmail(token);
      return NextResponse.json(
        sendSuccess({ message: "E-posta adresiniz başarıyla doğrulandı." }),
      );
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ─── Resend Verification ───

  resendVerification: async (req: NextRequest) => {
    try {
      const userId = await extractUserId(req);
      await authService.sendVerificationEmail(userId);
      return NextResponse.json(
        sendSuccess({ message: "Doğrulama e-postası gönderildi." }),
      );
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ─── Get Current User ───

  me: async (req: NextRequest) => {
    try {
      const userId = await extractUserId(req);
      const user = await authService.getMe(userId);
      return NextResponse.json(sendSuccess(user));
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ─── MFA Setup (Skeleton) ───

  setupMfa: async (req: NextRequest) => {
    try {
      const userId = await extractUserId(req);
      const body = await req.json();
      const parsed = mfaSetupSchema.parse(body);
      const result = await authService.setupMfa(userId, parsed.method);
      return NextResponse.json(sendSuccess(result));
    } catch (error) {
      return handleApiError(error);
    }
  },

  // ─── MFA Verify (Skeleton) ───

  verifyMfa: async (req: NextRequest) => {
    try {
      const userId = await extractUserId(req);
      const body = await req.json();
      const parsed = mfaVerifySchema.parse(body);
      const result = await authService.verifyMfa(userId, parsed.code);
      return NextResponse.json(sendSuccess(result));
    } catch (error) {
      return handleApiError(error);
    }
  },
};