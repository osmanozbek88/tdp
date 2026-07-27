





import type { OrderStatus, EsimStatus } from "./types";

/**
 * DTO (Data Transfer Object) helpers — normalize raw provider data
 * into canonical formats used by the rest of the application.
 *
 * Every provider adapter uses these to ensure consistency in:
 *   - ICCID validation & formatting
 *   - Date string normalisation
 *   - Status code mapping
 */

const ICCID_REGEX = /^\d{18,22}$/;

/** Generate a valid-looking 20-digit ICCID. Used by Fake Provider only. */
export function generateFakeIccid(seed?: number): string {
  const prefix = "89"; // Telecom industry prefix
  const major = "1234"; // Issuer identifier (fake)
  const serial = String(seed ?? Date.now() + Math.floor(Math.random() * 10_000_000))
    .padStart(14, "0")
    .slice(0, 14);
  const raw = prefix + major + serial;
  // Luhn-like checksum: sum all digits, append last digit of sum
  const sum = raw.split("").reduce((acc, d) => acc + parseInt(d, 10), 0);
  return raw + (sum % 10);
}

/** Validate ICCID format. Returns true for 18-22 digit numeric strings. */
export function isValidIccid(iccid: string): boolean {
  return ICCID_REGEX.test(iccid);
}

/** Normalise an ISO date string to "YYYY-MM-DDTHH:mm:ss.sssZ". */
export function normalizeDate(raw: string | Date | null | undefined): string {
  if (!raw) return new Date().toISOString();
  const d = raw instanceof Date ? raw : new Date(raw);
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

/** Normalise order status strings to canonical OrderStatus enum. */
export function normalizeOrderStatus(raw: string): OrderStatus {
  const upper = raw.toUpperCase().trim();
  const map: Record<string, OrderStatus> = {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
    FAILED: "FAILED",
    REFUNDED: "REFUNDED",
    // Telna-specific mappings (if any)
    CREATED: "PENDING",
    SUBMITTED: "PROCESSING",
    DONE: "COMPLETED",
    CANCELED: "CANCELLED",
    ERROR: "FAILED",
  };
  return map[upper] ?? "PENDING";
}

/** Normalise eSIM status strings to canonical EsimStatus enum. */
export function normalizeEsimStatus(raw: string): EsimStatus {
  const upper = raw.toUpperCase().trim();
  const map: Record<string, EsimStatus> = {
    INACTIVE: "INACTIVE",
    ACTIVE: "ACTIVE",
    SUSPENDED: "SUSPENDED",
    TERMINATED: "TERMINATED",
    EXPIRED: "EXPIRED",
    // Alternative names
    DEACTIVATED: "INACTIVE",
    PAUSED: "SUSPENDED",
    CANCELLED: "TERMINATED",
    REVOKED: "TERMINATED",
  };
  return map[upper] ?? "INACTIVE";
}





