
import crypto from "crypto";
import { promisify } from "util";

const randomBytes = promisify(crypto.randomBytes);

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = "sha512";

/**
 * Deterministic SHA-256 hash for token lookups.
 * Use this for random tokens (password reset, email verification)
 * where the plaintext is high-entropy and needs to be looked up by hash.
 */
export function sha256Hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Hash a plaintext token/password using PBKDF2 with a generated salt.
 * Returns `${salt}:${hash}` for storage.
 */
export async function hashToken(token: string): Promise<string> {
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = await hashWithSalt(token, salt);
  return `${salt}:${hash}`;
}

/**
 * Verify a plaintext token against a stored `salt:hash` value.
 */
export async function verifyTokenHash(
  token: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const computed = await hashWithSalt(token, salt);
  return timingSafeEqual(computed, hash);
}

async function hashWithSalt(value: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      value,
      salt,
      PBKDF2_ITERATIONS,
      PBKDF2_KEYLEN,
      PBKDF2_DIGEST,
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey.toString("hex"));
      },
    );
  });
}

/**
 * Generate a cryptographically secure random token string.
 */
export async function generateToken(bytes: number = 48): Promise<string> {
  const buf = await randomBytes(bytes);
  return buf.toString("base64url");
}

/**
 * Generate a 6-digit numeric OTP.
 */
export function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
