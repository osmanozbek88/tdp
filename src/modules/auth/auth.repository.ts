import { BaseRepository } from "@/lib/repository";
import { prisma } from "@/lib/prisma";
import type { User, RefreshToken, EmailVerificationToken, PasswordResetToken } from "@prisma/client";

export interface AuthUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  distributorId: string | null;
  dealerId: string | null;
  subDealerId: string | null;
  isActive: boolean;
  emailVerifiedAt: Date | null;
  mfaEnabled: boolean;
  mfaMethod: string | null;
  mfaSecret: string | null;
  passwordChangedAt: Date | null;
}

type CreateAuthUserInput = Omit<AuthUserRecord, "id">;
type UpdateAuthInput = Partial<CreateAuthUserInput>;

export class AuthRepository extends BaseRepository<
  AuthUserRecord,
  CreateAuthUserInput,
  UpdateAuthInput
> {
  constructor() {
    super("user");
  }

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    return this.findMany({ where: { email } }).then(
      (users) => users[0] ?? null,
    );
  }

  // ─── Refresh Tokens ───

  async createRefreshToken(
    userId: string,
    tokenHash: string,
    jti: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    return (prisma as Record<string, unknown>).refreshToken.create({
      data: {
        id: jti,
        userId,
        tokenHash,
        expiresAt,
      },
    }) as Promise<RefreshToken>;
  }

  async findRefreshToken(jti: string): Promise<RefreshToken | null> {
    return (prisma as Record<string, unknown>).refreshToken.findUnique({
      where: { id: jti },
    }) as Promise<RefreshToken | null>;
  }

  async revokeRefreshToken(jti: string): Promise<void> {
    await (prisma as Record<string, unknown>).refreshToken.update({
      where: { id: jti },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await (prisma as Record<string, unknown>).refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ─── Email Verification ───

  async createEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<EmailVerificationToken> {
    return (prisma as Record<string, unknown>).emailVerificationToken.create({
      data: { userId, tokenHash, expiresAt },
    }) as Promise<EmailVerificationToken>;
  }

  async findEmailVerificationToken(
    tokenHash: string,
  ): Promise<EmailVerificationToken | null> {
    const tokens = await (prisma as Record<string, unknown>).emailVerificationToken.findMany({
      where: { tokenHash, usedAt: null },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    return (tokens as EmailVerificationToken[])[0] ?? null;
  }

  async markEmailVerified(userId: string): Promise<void> {
    await (prisma as Record<string, unknown>).user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  async consumeVerificationToken(tokenId: string): Promise<void> {
    await (prisma as Record<string, unknown>).emailVerificationToken.update({
      where: { id: tokenId },
      data: { usedAt: new Date() },
    });
  }

  // ─── Password Reset ───

  async createPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<PasswordResetToken> {
    return (prisma as Record<string, unknown>).passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    }) as Promise<PasswordResetToken>;
  }

  async findPasswordResetToken(
    tokenHash: string,
  ): Promise<PasswordResetToken | null> {
    const tokens = await (prisma as Record<string, unknown>).passwordResetToken.findMany({
      where: { tokenHash, usedAt: null },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    return (tokens as PasswordResetToken[])[0] ?? null;
  }

  async consumePasswordResetToken(tokenId: string): Promise<void> {
    await (prisma as Record<string, unknown>).passwordResetToken.update({
      where: { id: tokenId },
      data: { usedAt: new Date() },
    });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await (prisma as Record<string, unknown>).user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
      },
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await (prisma as Record<string, unknown>).user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}
