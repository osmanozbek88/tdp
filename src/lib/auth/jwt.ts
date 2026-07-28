import { SignJWT, jwtVerify } from "jose";
import { getEnv } from "@/config/env";

const secret = new TextEncoder().encode(getEnv().AUTH_SECRET);

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
}

export interface RefreshJwtPayload {
  sub: string;
  jti: string;
}

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret);
}

export async function signRefreshToken(
  payload: Pick<JwtPayload, "sub">,
  jti: string,
): Promise<string> {
  return new SignJWT({ sub: payload.sub, jti })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as JwtPayload;
}

export async function verifyRefreshToken(token: string): Promise<RefreshJwtPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as RefreshJwtPayload;
}
