import { BaseService } from "@/lib/service";
import { AuthRepository } from "./auth.repository";
import { UnauthorizedError, ConflictError, NotFoundError } from "@/lib/errors";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/lib/auth/jwt";
import { hashToken, sha256Hash, verifyTokenHash, generateToken } from "@/lib/crypto";
import { emailService } from "@/lib/email";
import { getEnv } from "@/config/env";

// bcryptjs v3 ESM/CJS uyumluluk sorunu nedeniyle require ile alıyoruz
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require("bcryptjs");

const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export class AuthService extends BaseService {
  private repository: AuthRepository;

  constructor() {
    super("AuthService");
    this.repository = new AuthRepository();
  }

  // ─── Login ───

  async login(email: string, password: string) {
    this.logger.info({ email }, "Login attempt");

    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError("E-posta veya şifre hatalı");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Hesabınız aktif değil");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError("E-posta veya şifre hatalı");
    }

    await this.repository.updateLastLogin(user.id);

    const tokens = await this.generateTokenPair(user);

    this.logger.info({ email }, "Login successful");

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        emailVerifiedAt: user.emailVerifiedAt,
        mfaEnabled: user.mfaEnabled,
      },
    };
  }

  // ─── Logout ───

  async logout(userId: string, refreshTokenJti: string) {
    this.logger.info({ userId }, "Logout");
    try {
      await this.repository.revokeRefreshToken(refreshTokenJti);
    } catch {
      // token already revoked or doesn't exist, that's fine
    }
  }

  // ─── Refresh ───

  async refresh(refreshTokenValue: string) {
    let payload;
    try {
      payload = await verifyRefreshToken(refreshTokenValue);
    } catch {
      throw new UnauthorizedError("Geçersiz veya süresi dolmuş refresh token");
    }

    const storedToken = await this.repository.findRefreshToken(payload.jti);
    if (!storedToken || storedToken.revokedAt) {
      throw new UnauthorizedError("Refresh token geçersiz veya iptal edilmiş");
    }

    const tokenHashValid = await verifyTokenHash(
      refreshTokenValue,
      storedToken.tokenHash,
    );
    if (!tokenHashValid) {
      throw new UnauthorizedError("Geçersiz refresh token");
    }

    // Rotate: revoke old, issue new
    await this.repository.revokeRefreshToken(payload.jti);

    const user = await this.repository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedError("Kullanıcı bulunamadı veya aktif değil");
    }

    const tokens = await this.generateTokenPair(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        emailVerifiedAt: user.emailVerifiedAt,
        mfaEnabled: user.mfaEnabled,
      },
    };
  }

  // ─── Forgot Password ───

  async forgotPassword(email: string) {
    this.logger.info({ email }, "Forgot password request");

    const user = await this.repository.findByEmail(email);

    // Always return success even if user doesn't exist (prevents email enumeration)
    if (!user) {
      this.logger.info({ email }, "Forgot password — user not found (silent)");
      return;
    }

    const rawToken = await generateToken();
    const tokenHash = sha256Hash(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

    await this.repository.createPasswordResetToken(
      user.id,
      tokenHash,
      expiresAt,
    );

    const resetUrl = `${getEnv().APP_URL}/reset-password?token=${rawToken}`;

    await emailService.send(
      user.email,
      "Şifre Sıfırlama Talebi",
      `Merhaba ${user.firstName},\n\nŞifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın (1 saat geçerlidir):\n\n${resetUrl}\n\nBu işlemi siz yapmadıysanız, bu e-postayı dikkate almayın.`,
    );

    this.logger.info({ email }, "Forgot password email sent");
  }

  // ─── Reset Password ───

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = sha256Hash(token);
    const storedToken = await this.repository.findPasswordResetToken(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedError(
        "Geçersiz veya süresi dolmuş sıfırlama bağlantısı",
      );
    }

    if (storedToken.expiresAt < new Date()) {
      await this.repository.consumePasswordResetToken(storedToken.id);
      throw new UnauthorizedError("Sıfırlama bağlantısının süresi dolmuş");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.repository.updatePassword(storedToken.userId, passwordHash);
    await this.repository.consumePasswordResetToken(storedToken.id);
    await this.repository.revokeAllUserRefreshTokens(storedToken.userId);

    this.logger.info({ userId: storedToken.userId }, "Password reset successful");
  }

  // ─── Email Verification ───

  async sendVerificationEmail(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }

    if (user.emailVerifiedAt) {
      throw new ConflictError("E-posta adresi zaten doğrulanmış", "ALREADY_VERIFIED");
    }

    const rawToken = await generateToken();
    const tokenHash = sha256Hash(rawToken);
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);

    await this.repository.createEmailVerificationToken(
      userId,
      tokenHash,
      expiresAt,
    );

    const verifyUrl = `${getEnv().APP_URL}/verify-email?token=${rawToken}`;

    await emailService.send(
      user.email,
      "E-posta Adresinizi Doğrulayın",
      `Merhaba ${user.firstName},\n\nE-posta adresinizi doğrulamak için aşağıdaki bağlantıya tıklayın (24 saat geçerlidir):\n\n${verifyUrl}\n\nAramıza hoş geldiniz!`,
    );

    this.logger.info({ userId }, "Verification email sent");
  }

  async verifyEmail(token: string) {
    const tokenHash = sha256Hash(token);
    const storedToken = await this.repository.findEmailVerificationToken(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedError(
        "Geçersiz veya süresi dolmuş doğrulama bağlantısı",
      );
    }

    if (storedToken.expiresAt < new Date()) {
      await this.repository.consumeVerificationToken(storedToken.id);
      throw new UnauthorizedError("Doğrulama bağlantısının süresi dolmuş");
    }

    await this.repository.markEmailVerified(storedToken.userId);
    await this.repository.consumeVerificationToken(storedToken.id);

    this.logger.info({ userId: storedToken.userId }, "Email verified");
  }

  // ─── MFA (Skeleton) ───

  async setupMfa(userId: string, method: "TOTP" | "EMAIL") {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundError("User", userId);

    // Placeholder: In production, generate TOTP secret + QR code via otplib
    const mfaSecret = `mfa_secret_placeholder_${await generateToken(16)}`;

    await (this.repository as Record<string, unknown>).update(userId, {
      mfaEnabled: true,
      mfaMethod: method,
      mfaSecret,
    } as Record<string, unknown>);

    this.logger.info({ userId, method }, "MFA setup (skeleton)");

    return {
      method,
      secret: method === "TOTP" ? mfaSecret : undefined,
      qrCodeUrl:
        method === "TOTP"
          ? `otpauth://totp/TDP:${user.email}?secret=MOCK&issuer=TDP`
          : undefined,
    };
  }

  async verifyMfa(userId: string, code: string) {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundError("User", userId);

    if (!user.mfaEnabled) {
      throw new ConflictError("MFA bu hesap için aktif değil", "MFA_NOT_ENABLED");
    }

    // Placeholder: In production, validate against TOTP
    // For skeleton, any 6-digit code is accepted
    if (!/^\d{6}$/.test(code)) {
      throw new UnauthorizedError("Geçersiz MFA kodu");
    }

    // Issue a long-lived session after successful MFA verification
    const tokens = await this.generateTokenPair(user);

    this.logger.info({ userId }, "MFA verification successful (skeleton)");

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  // ─── Get Current User ───

  async getMe(userId: string) {
    const user = await this.repository.findById(userId);
    if (!user) throw new UnauthorizedError("Kullanıcı bulunamadı");

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      emailVerifiedAt: user.emailVerifiedAt,
      mfaEnabled: user.mfaEnabled,
      mfaMethod: user.mfaMethod,
      distributorId: user.distributorId,
      dealerId: user.dealerId,
      subDealerId: user.subDealerId,
      isActive: user.isActive,
    };
  }

  // ─── Helpers ───

  private async generateTokenPair(user: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  }) {
    const accessToken = await signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    const jti = await generateToken(24);
    const rawRefreshToken = await generateToken();
    const tokenHash = await hashToken(rawRefreshToken);
    const refreshToken = await signRefreshToken({ sub: user.id }, jti);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await this.repository.createRefreshToken(
      user.id,
      tokenHash,
      jti,
      expiresAt,
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}
