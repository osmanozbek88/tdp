





import type { OrderStatus, GsmEsimStatus } from "./types";

/**
 * DTO (Data Transfer Object) helpers — normalize raw provider data
 * into canonical formats.
 *
 * Covers:
 *   - ICCID:   ITU‑T E.118, 18‑22 digits, Luhn checksum
 *   - EID:     GSMA SGP.29, 32 hex digits
 *   - IMSI:    ITU‑T E.212, 15 digits (MCC‑MNC‑MSIN)
 *   - Activation code: SGP.22 LPA:1$SMDP$MATCHING_ID
 *   - DateTime: ISO 8601 UTC
 *   - Status mapping: provider‑specific → canonical
 */

// ─── Constants ───

const ICCID_REGEX = /^\d{18,22}$/;
const EID_REGEX = /^[0-9A-Fa-f]{32}$/;
const IMSI_REGEX = /^\d{14,15}$/;

/** Well‑known MCC‑MNC pairs for realistic IMSI generation. */
const MCC_MNC_POOL: [string, string][] = [
  ["286", "01"],  // TR Turkcell
  ["286", "02"],  // TR Vodafone TR
  ["286", "03"],  // TR Türk Telekom
  ["310", "410"], // US AT&T
  ["310", "260"], // US T‑Mobile
  ["234", "15"],  // GB Vodafone UK
  ["234", "10"],  // GB O2
  ["262", "01"],  // DE Telekom
  ["424", "03"],  // AE du
  ["901", "70"],  // Global / roaming hub
];

// ─── Luhn Checksum ───

/**
 * Compute Luhn (mod 10) checksum digit for ICCID.
 *
 * Algorithm per ITU‑T E.118 / ISO/IEC 7812‑1:
 *   1. Double every second digit from the right.
 *   2. If doubling >= 10, sum the two digits.
 *   3. Sum all digits.
 *   4. Check digit = (10 – (sum % 10)) % 10.
 */
function luhnDigit(digits: string): number {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i]!, 10);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return (10 - (sum % 10)) % 10;
}

/** Validate a full ICCID (including its Luhn check digit). */
export function isValidIccid(iccid: string): boolean {
  if (!ICCID_REGEX.test(iccid)) return false;
  const body = iccid.slice(0, -1);
  const check = parseInt(iccid.slice(-1), 10);
  return luhnDigit(body) === check;
}

/**
 * Generate a standards‑compliant fake ICCID.
 *
 * Format: 89 (industry: telecom) + CC (2‑digit country code) +
 *         issuer (2‑4 digits) + serial + Luhn check digit.
 *
 * Result is always 20 digits.
 */
export function generateFakeIccid(countryCode = "90", seed?: number): string {
  // "89" = telecom, country from ISO numeric truncated to 2 digits
  const prefix = "89" + countryCode.slice(0, 2);
  const issuer = "12"; // Fake issuer ID
  const serial = String(seed ?? Date.now() + Math.floor(Math.random() * 10_000_000))
    .padStart(12, "0")
    .slice(0, 12);
  const body = prefix + issuer + serial;
  const check = luhnDigit(body);
  return body + check;
}

// ─── EID ───

/**
 * Generate a fake 32‑hex‑digit EID (eUICC identifier).
 *
 * GSMA SGP.29 format — simply random hex for test purposes.
 */
export function generateFakeEid(): string {
  const chars = "0123456789abcdef";
  let eid = "";
  for (let i = 0; i < 32; i++) {
    eid += chars[Math.floor(Math.random() * 16)];
  }
  return eid;
}

/** Validate EID format (32 hex digits). */
export function isValidEid(eid: string): boolean {
  return EID_REGEX.test(eid);
}

// ─── IMSI ───

/**
 * Generate a 15‑digit IMSI with a randomly selected MCC‑MNC.
 */
export function generateFakeImsi(): string {
  const [mcc, mnc] = MCC_MNC_POOL[Math.floor(Math.random() * MCC_MNC_POOL.length)]!;
  const msin = String(Math.floor(Math.random() * 10_000_000_000)).padStart(10, "0");
  return mcc + mnc + msin;
}

/** Validate IMSI format (14‑15 digits). */
export function isValidImsi(imsi: string): boolean {
  return IMSI_REGEX.test(imsi);
}

// ─── MSISDN ───

/**
 * Generate a fake E.164 MSISDN for a given country code.
 */
export function generateFakeMsisdn(countryCode = "90"): string {
  const subscriber = String(Math.floor(Math.random() * 100_000_000_0)).padStart(10, "0");
  return `+${countryCode}${subscriber}`;
}

// ─── SGP.22 Activation Code ───

/**
 * Build an SGP.22‑compliant activation code.
 *
 * Format:  LPA:1$SMDP_ADDRESS$MATCHING_ID
 *
 * Optionally includes a confirmation code if the profile requires one,
 * but for data‑only fake eSIMs we omit it.
 */
export function buildActivationCode(smdpAddress: string, matchingId: string): string {
  return `LPA:1$${smdpAddress}$${matchingId}`;
}

/**
 * Parse an SGP.22 activation code into its components.
 */
export function parseActivationCode(code: string): {
  smdpAddress: string;
  matchingId: string;
  confirmationCode?: string;
} | null {
  // LPA:1$SMDP$MATCHING_ID or LPA:1$SMDP$MATCHING_ID$CONFIRMATION
  const match = code.match(/^LPA:1\$(.+?)\$(.+?)(?:\$(.+))?$/);
  if (!match) return null;
  return {
    smdpAddress: match[1]!,
    matchingId: match[2]!,
    confirmationCode: match[3],
  };
}

// ─── Date / Time ───

/** Normalise an ISO 8601 UTC date string. */
export function normalizeDate(raw: string | Date | null | undefined): string {
  if (!raw) return new Date().toISOString();
  const d = raw instanceof Date ? raw : new Date(raw);
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

// ─── Order Status Mapping ───

const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  // Canonical
  PENDING:      "pending",
  PROVISIONING: "provisioning",
  COMPLETED:    "completed",
  FAILED:       "failed",
  CANCELLED:    "cancelled",
  // Aliases / alternative spellings
  CANCELED:     "cancelled",
  CREATED:      "pending",
  SUBMITTED:    "provisioning",
  DONE:         "completed",
  ERROR:        "failed",
  PROCESSING:   "provisioning",
};

export function normalizeOrderStatus(raw: string): OrderStatus {
  return ORDER_STATUS_MAP[raw.toUpperCase().trim()] ?? "pending";
}

// ─── GSMA eSIM Status Mapping ───

const ESIM_STATUS_MAP: Record<string, GsmEsimStatus> = {
  // Canonical GSMA
  RELEASED:   "released",
  DOWNLOADED: "downloaded",
  INSTALLED:  "installed",
  ENABLED:    "enabled",
  DISABLED:   "disabled",
  DELETED:    "deleted",
  // Legacy aliases
  INACTIVE:   "released",
  ACTIVE:     "enabled",
  SUSPENDED:  "disabled",
  TERMINATED: "deleted",
  EXPIRED:    "deleted",
  PAUSED:     "disabled",
  REVOKED:    "deleted",
  CANCELLED:  "deleted",
};

export function normalizeEsimStatus(raw: string): GsmEsimStatus {
  return ESIM_STATUS_MAP[raw.toUpperCase().trim()] ?? "released";
}





