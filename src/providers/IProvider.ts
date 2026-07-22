// ============================================================
// Provider Interface — Telecom Distribution Platform
// ============================================================
// This is the contract between TDP and any external telecom provider.
// Implementations: FakeProvider (dev/test), TelnaProvider (production).
// ============================================================

// ─── Auth ───

export interface AuthResult {
  accessToken: string;
  expiresAt: Date;
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  timestamp: Date;
}

// ─── Product Catalog ───

export type ProductType = "ESIM" | "DATA_BUNDLE" | "VOICE_BUNDLE" | "TOPUP";

export interface ProductFilter {
  countryId?: string;
  type?: ProductType;
  search?: string;
}

export interface ProductSpecifications {
  volume?: number;
  volumeUnit?: "MB" | "GB";
  duration?: number;
  durationUnit?: "DAY" | "WEEK" | "MONTH" | "YEAR";
  speedCap?: string;
  isRoaming?: boolean;
  supportedCountries?: string[];
}

export interface ProviderProduct {
  telnaProductId: string;
  name: string;
  description: string;
  type: ProductType;
  country: string;
  region?: string;
  currency: string;
  price: number;
  costPrice?: number;
  specifications: ProductSpecifications;
  isActive: boolean;
}

export interface ProviderCountry {
  isoCode: string;
  name: string;
  dialCode: string;
  regions?: ProviderRegion[];
}

export interface ProviderRegion {
  code: string;
  name: string;
}

// ─── Order Management ───

export interface CreateOrderParams {
  customerEmail: string;
  customerName?: string;
  items: OrderItemInput[];
  notes?: string;
}

export interface OrderItemInput {
  telnaProductId: string;
  quantity: number;
}

export type OrderProviderStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface OrderItemResult {
  telnaItemId: string;
  telnaProductId: string;
  iccid?: string;
  status: OrderProviderStatus;
}

export interface OrderResult {
  telnaOrderId: string;
  status: OrderProviderStatus;
  items: OrderItemResult[];
  createdAt: Date;
}

export interface OrderStatusResult {
  telnaOrderId: string;
  status: OrderProviderStatus;
  items: OrderItemResult[];
  updatedAt: Date;
}

export interface CancelResult {
  success: boolean;
  telnaOrderId: string;
  cancelledItems: string[];
}

// ─── eSIM Lifecycle ───

export type EsimProviderStatus =
  | "AVAILABLE"
  | "ASSIGNED"
  | "ACTIVATED"
  | "SUSPENDED"
  | "TERMINATED"
  | "EXPIRED";

export interface ActivateEsimParams {
  iccid: string;
  activationCode?: string;
}

export interface ActivateEsimResult {
  iccid: string;
  status: EsimProviderStatus;
  qrCodeUrl?: string;
  activationCode?: string;
  smdpAddress?: string;
  confirmationCode?: string;
}

export interface EsimDetails {
  iccid: string;
  status: EsimProviderStatus;
  imsi?: string;
  msisdn?: string;
  activatedAt?: Date;
  expiresAt?: Date;
  currentPlan?: string;
  remainingData?: number;
  remainingDataUnit?: "MB" | "GB";
}

export interface QrCodeResult {
  iccid: string;
  qrCodeBase64: string;
  qrCodeUrl: string;
  activationCode: string;
  smdpAddress: string;
}

export interface SuspendResult {
  success: boolean;
  iccid: string;
  status: EsimProviderStatus;
}

export interface TerminateResult {
  success: boolean;
  iccid: string;
}

// ─── Usage ───

export interface UsagePeriod {
  startDate: Date;
  endDate: Date;
}

export interface UsageDetail {
  timestamp: Date;
  amount: number;
  type: "DATA" | "VOICE" | "SMS";
  direction?: "IN" | "OUT";
  destination?: string;
}

export interface UsageRecord {
  iccid: string;
  type: "DATA" | "VOICE" | "SMS";
  usedAmount: number;
  totalAmount: number;
  unit: "MB" | "GB" | "MIN" | "SMS";
  periodStart: Date;
  periodEnd: Date;
  details?: UsageDetail[];
}

// ─── Webhook ───

export type WebhookEventType =
  | "ORDER_STATUS_CHANGED"
  | "ESIM_ACTIVATED"
  | "ESIM_SUSPENDED"
  | "ESIM_TERMINATED"
  | "USAGE_THRESHOLD"
  | "TOPUP_COMPLETED";

export interface WebhookPayload {
  eventType: WebhookEventType;
  telnaOrderId?: string;
  iccid?: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

export interface WebhookResult {
  success: boolean;
  eventId: string;
}

// ─── Provider Error ───

export type ProviderErrorCode =
  | "AUTH_FAILED"
  | "INVALID_REQUEST"
  | "PRODUCT_NOT_FOUND"
  | "ORDER_FAILED"
  | "ESIM_NOT_FOUND"
  | "ACTIVATION_FAILED"
  | "INSUFFICIENT_CREDIT"
  | "RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE"
  | "TIMEOUT"
  | "UNKNOWN";

export class ProviderError extends Error {
  public readonly code: ProviderErrorCode;
  public readonly statusCode?: number;
  public readonly rawResponse?: unknown;

  constructor(
    code: ProviderErrorCode,
    message: string,
    statusCode?: number,
    rawResponse?: unknown,
  ) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
    this.statusCode = statusCode;
    this.rawResponse = rawResponse;
  }
}

// ─── IProvider Interface ───

export interface IProvider {
  /** Authentication & Health */
  authenticate(): Promise<AuthResult>;
  healthCheck(): Promise<HealthStatus>;

  /** Product Catalog */
  getProducts(filter?: ProductFilter): Promise<ProviderProduct[]>;
  getCountries(): Promise<ProviderCountry[]>;
  getRegions(countryId: string): Promise<ProviderRegion[]>;

  /** Order Management */
  createOrder(params: CreateOrderParams): Promise<OrderResult>;
  getOrderStatus(telnaOrderId: string): Promise<OrderStatusResult>;
  cancelOrder(telnaOrderId: string): Promise<CancelResult>;

  /** eSIM Lifecycle */
  activateEsim(params: ActivateEsimParams): Promise<ActivateEsimResult>;
  getEsimDetails(iccid: string): Promise<EsimDetails>;
  getQrCode(iccid: string): Promise<QrCodeResult>;
  suspendEsim(iccid: string): Promise<SuspendResult>;
  terminateEsim(iccid: string): Promise<TerminateResult>;

  /** Usage */
  getUsage(iccid: string, period?: UsagePeriod): Promise<UsageRecord[]>;

  /** Webhook */
  handleWebhook(payload: WebhookPayload): Promise<WebhookResult>;
}
