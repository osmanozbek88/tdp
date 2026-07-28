



/**
 * Canonical DTO types for the provider layer.
 *
 * All provider adapters map their native formats to these DTOs.
 *
 * Standards enforced:
 *   - ICCID: 18‑22 digit numeric (ITU‑T E.118), Luhn checksum
 *   - IMSI:  15 digit numeric (ITU‑T E.212), MCC‑MNC prefix
 *   - EID:   32 hex digit (GSMA SGP.29)
 *   - MSISDN: E.164 format, optional (data‑only eSIMs may omit)
 *   - Currency: ISO 4217
 *   - Country:  ISO 3166‑1 alpha‑2
 *   - Date/time: ISO 8601 UTC
 *   - Activation code: SGP.22 LPA:1$SMDP_ADDRESS$MATCHING_ID
 */

// ─── Enums ───

/** Plan / bundle type. */
export type PlanType = "data_only" | "voice_data" | "iot";

/** Usage record type. */
export type UsageRecordType = "data" | "sms" | "voice";

/**
 * Order status state machine:
 *   pending → provisioning → completed
 *                         ↘ failed
 *   Any terminal state can go → cancelled
 */
export type OrderStatus =
  | "pending"
  | "provisioning"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * GSMA SGP.02 / SGP.22 eSIM profile state machine:
 *   released → downloaded → installed → enabled ↔ disabled
 *                                     → deleted
 *
 * "released"   – Profile prepared on SM‑DP+ but not yet associated to an EID.
 * "downloaded" – Profile has been retrieved by LPA on the device, not yet active.
 * "installed"  – Profile present in LPA, ready to be enabled.
 * "enabled"    – Profile is active on the device (traffic enabled).
 * "disabled"   – Profile suspended (can be re‑enabled).
 * "deleted"    – Profile permanently removed from eUICC.
 */
export type GsmEsimStatus =
  | "released"
  | "downloaded"
  | "installed"
  | "enabled"
  | "disabled"
  | "deleted";

/** Subscriber / account status. */
export type SubscriberStatus = "active" | "suspended" | "closed";

/** Billing / invoice status. */
export type BillingStatus = "open" | "paid" | "overdue";

/** Webhook event types matching Telna Event Webhooks convention. */
export type WebhookEventType =
  | "order.completed"
  | "order.failed"
  | "esim.installed"
  | "esim.enabled"
  | "esim.disabled"
  | "esim.deleted"
  | "usage.threshold_reached";

// ─── Country & Region ───

export interface ProviderCountry {
  code: string;  // ISO 3166-1 alpha-2, e.g. "TR"
  name: string;
  flag: string | null;
  regions: ProviderRegion[];
}

export interface ProviderRegion {
  code: string;
  name: string;
}

// ─── Plan / Product ───

export interface ProviderPlan {
  planId: string;
  name: string;
  countryCoverage: string[];          // ISO 3166-1 alpha-2 codes, or ["GLOBAL"]
  dataLimitMB: number | null;         // null = unlimited
  validityDays: number;
  currency: string;                   // ISO 4217
  wholesalePrice: number;
  retailPrice: number;
  planType: PlanType;
  apn: string | null;
  throttling: string | null;
  tethering: boolean;
}

/** @deprecated Use ProviderPlan for new code. */
export type ProviderProduct = ProviderPlan;

/** @deprecated Use PlanType for new code. */
export type ProductType = PlanType;

/** @deprecated Use ProviderPlan for new code. */
export interface ProductSpecifications {
  networkType?: "3G" | "4G" | "5G";
  coverage?: string[];
  throttling?: string;
  tethering?: boolean;
  apn?: string;
  notes?: string;
}

// ─── Subscriber / Account ───

export interface ProviderSubscriber {
  accountId: string;        // UUID
  externalRef: string;      // Provider‑side customer ID
  email: string;
  countryCode: string;      // ISO 3166-1 alpha-2
  status: SubscriberStatus;
  createdAt: string;        // ISO 8601
  updatedAt: string;
}

export interface CreateSubscriberRequest {
  email: string;
  externalRef?: string;
  countryCode?: string;
}

// ─── eSIM Profile (GSMA SM‑DP+ based) ───

export interface ProviderEsimProfile {
  iccid: string;            // 18‑22 numeric, Luhn checksum
  eid: string | null;       // 32 hex digits (eUICC identity), null if not bound
  imsi: string | null;      // 15 numeric digits
  msisdn: string | null;    // E.164, data‑only eSIMs may omit
  activationCode: string;   // SGP.22 format: LPA:1$SMDP_ADDRESS$MATCHING_ID
  qrCodeUrl: string;        // URL to QR image (PNG/SVG)
  smdpAddress: string;      // SM‑DP+ server address
  matchingId: string;       // Profile matching code
  profileStatus: GsmEsimStatus;
  apn: string | null;
  planId: string | null;
  orderId: string | null;
  subscriberId: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Activation response returned after a successful provision. */
export interface ProviderEsimActivation {
  iccid: string;
  activationCode: string;   // SGP.22 LPA:1$… format
  qrCodeUrl: string;
  smdpAddress: string;
  matchingId: string;
}

/** @deprecated Use ProviderEsimProfile for new code. */
export type ProviderEsimDetails = ProviderEsimProfile & {
  productName: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
};

// ─── Order ───

export interface ProviderOrderRequest {
  planId: string;
  quantity: number;
  subscriberId?: string;
  customerEmail: string;
  customerFirstName?: string;
  customerLastName?: string;
  countryCode?: string;
  phone?: string;
}

export interface ProviderOrderResult {
  orderId: string;
  subscriberId: string | null;
  planId: string;
  status: OrderStatus;
  quantity: number;
  items: ProviderOrderItem[];
  createdAt: string;
  activatedAt: string | null;
}

export interface ProviderOrderItem {
  itemId: string;
  iccid: string | null;       // Null until provisioned
  eid: string | null;
  status: OrderStatus;
  qrCodeUrl: string | null;
  activationCode: string | null;
  smdpAddress: string | null;
  matchingId: string | null;
}

// ─── Usage / CDR ───

export interface ProviderUsageRecord {
  usageId: string;
  iccid: string;
  sessionStart: string;       // ISO 8601
  sessionEnd: string;
  dataUsedMB: number;
  networkMccMnc: string;      // Roamed network MCC‑MNC, e.g. "28601"
  country: string;            // ISO 3166-1 alpha-2 of roamed network
  recordType: UsageRecordType;
}

export interface ProviderUsageSummary {
  iccid: string;
  dataUsedMB: number;
  dataTotalMB: number;
  voiceUsedMinutes: number;
  voiceTotalMinutes: number;
  smsUsed: number;
  smsTotal: number;
  periodStart: string;
  periodEnd: string;
}

// ─── Billing / Invoice ───

export interface ProviderBillingRecord {
  invoiceId: string;
  accountId: string;
  periodStart: string;        // ISO 8601 date
  periodEnd: string;
  amount: number;
  currency: string;           // ISO 4217
  status: BillingStatus;
  lineItems: ProviderBillingLineItem[];
}

export interface ProviderBillingLineItem {
  planId: string;
  quantity: number;
  unitPrice: number;
  description: string;
}

// ─── Webhook ───

export interface ProviderWebhookPayload {
  eventId: string;            // UUID
  eventType: WebhookEventType;
  timestamp: string;          // ISO 8601
  payload: Record<string, unknown>;  // Full JSON of the related resource
}

/** Webhook as received on the wire, with HMAC‑SHA256 signature. */
export interface ProviderWebhookEnvelope {
  eventId: string;
  eventType: string;
  timestamp: string;
  payload: Record<string, unknown>;
  signature: string;          // HMAC‑SHA256(webhookSecret, eventId + "." + timestamp + "." + JSON.stringify(payload))
}


