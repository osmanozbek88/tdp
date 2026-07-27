



/**
 * Canonical DTO types for the provider layer.
 * All provider adapters map their native formats to these DTOs,
 * ensuring the rest of the application is provider-agnostic.
 */

// ─── Enums ───

export type ProductType = "ESIM" | "DATA_BUNDLE" | "VOICE_BUNDLE" | "TOPUP";

export type UsageType = "DATA" | "VOICE" | "SMS";

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED"
  | "REFUNDED";

export type EsimStatus =
  | "INACTIVE"
  | "ACTIVE"
  | "SUSPENDED"
  | "TERMINATED"
  | "EXPIRED";

export type WebhookEventType =
  | "order.status_changed"
  | "esim.activated"
  | "esim.usage_updated"
  | "esim.suspended"
  | "esim.reactivated"
  | "esim.terminated"
  | "esim.expired";

// ─── Country & Region ───

export interface ProviderCountry {
  code: string; // ISO-3166 alpha-2, e.g. "TR"
  name: string;
  flag: string | null;
  regions: ProviderRegion[];
}

export interface ProviderRegion {
  code: string;
  name: string;
}

// ─── Product ───

export interface ProviderProduct {
  id: string;
  name: string;
  description: string | null;
  type: ProductType;
  country: string;
  region: string | null;
  currency: string;
  price: number;
  costPrice: number | null;
  dataAmountMB: number | null;
  durationDays: number | null;
  specifications: ProductSpecifications | null;
}

export interface ProductSpecifications {
  networkType?: "3G" | "4G" | "5G";
  coverage?: string[];
  throttling?: string;
  tethering?: boolean;
  apn?: string;
  notes?: string;
}

// ─── Order ───

export interface ProviderOrderRequest {
  productId: string;
  quantity: number;
  customerEmail: string;
  customerFirstName?: string;
  customerLastName?: string;
  countryCode?: string;
  phone?: string;
}

export interface ProviderOrderResult {
  providerOrderId: string;
  status: OrderStatus;
  items: ProviderOrderItem[];
  createdAt: string;
}

export interface ProviderOrderItem {
  providerItemId: string;
  iccid: string | null;
  status: OrderStatus;
  qrCodeUrl: string | null;
  activationCode: string | null;
  smdpAddress: string | null;
}

// ─── eSIM ───

export interface ProviderEsimDetails {
  iccid: string;
  status: EsimStatus;
  imsi: string | null;
  msisdn: string | null;
  qrCodeUrl: string | null;
  activationCode: string | null;
  smdpAddress: string | null;
  productName: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface ProviderEsimActivation {
  iccid: string;
  activationCode: string;
  qrCodeUrl: string;
  smdpAddress: string | null;
}

// ─── Usage ───

export interface ProviderUsageRecord {
  type: UsageType;
  usedAmount: number;
  totalAmount: number;
  unit: string;
  remainingAmount: number;
  periodStart: string;
  periodEnd: string;
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

// ─── Webhook ───

export interface ProviderWebhookPayload {
  eventType: WebhookEventType;
  provider: string;
  timestamp: string;
  data: Record<string, unknown>;
}


