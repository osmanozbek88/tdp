/**
 * Provider interface for eSIM/telecom services.
 *
 * Each provider (Telna, etc.) implements this interface,
 * allowing the platform to switch between providers
 * or use multiple providers simultaneously.
 */

// ─── Common Types ───

export interface ProviderProduct {
  id: string;
  name: string;
  description: string | null;
  type: "ESIM" | "DATA_BUNDLE" | "VOICE_BUNDLE" | "TOPUP";
  country: string;
  region: string | null;
  currency: string;
  price: number;
  costPrice: number | null;
  specifications: Record<string, unknown> | null;
}

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
  status: string;
  items: ProviderOrderItem[];
}

export interface ProviderOrderItem {
  providerItemId: string;
  iccid: string | null;
  status: string;
  qrCodeUrl: string | null;
  activationCode: string | null;
  smdpAddress: string | null;
}

export interface ProviderEsimStatus {
  iccid: string;
  status: string;
  imsi: string | null;
  msisdn: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
}

export interface ProviderUsageRecord {
  type: "DATA" | "VOICE" | "SMS";
  usedAmount: number;
  totalAmount: number;
  unit: string;
  periodStart: string;
  periodEnd: string;
}

export interface ProviderWebhookPayload {
  eventType: string;
  source: string;
  payload: Record<string, unknown>;
}

// ─── Provider Interface ───

export interface Provider {
  readonly name: string;

  /** Fetch available products from the provider. */
  fetchProducts(): Promise<ProviderProduct[]>;

  /** Submit an order to the provider. */
  createOrder(request: ProviderOrderRequest): Promise<ProviderOrderResult>;

  /** Get eSIM status by ICCID. */
  getEsimStatus(iccid: string): Promise<ProviderEsimStatus>;

  /** Get usage records for an eSIM. */
  getUsageRecords(
    iccid: string,
    from: string,
    to: string,
  ): Promise<ProviderUsageRecord[]>;

  /** Suspend an eSIM. */
  suspendEsim(iccid: string): Promise<void>;

  /** Reactivate a suspended eSIM. */
  reactivateEsim(iccid: string): Promise<void>;

  /** Terminate an eSIM. */
  terminateEsim(iccid: string): Promise<void>;

  /** Process an incoming webhook from the provider. */
  processWebhook(payload: ProviderWebhookPayload): Promise<void>;
}

// ─── Provider Registry ───

const providers = new Map<string, Provider>();

export function registerProvider(name: string, provider: Provider): void {
  providers.set(name, provider);
}

export function getProvider(name: string): Provider {
  const provider = providers.get(name);
  if (!provider) {
    throw new Error(`Provider '${name}' is not registered`);
  }
  return provider;
}

export function getRegisteredProviders(): string[] {
  return Array.from(providers.keys());
}
