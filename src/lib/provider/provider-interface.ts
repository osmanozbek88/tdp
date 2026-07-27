




import type {
  ProviderProduct,
  ProviderOrderRequest,
  ProviderOrderResult,
  ProviderEsimDetails,
  ProviderEsimActivation,
  ProviderUsageRecord,
  ProviderUsageSummary,
  ProviderCountry,
  ProviderWebhookPayload,
} from "./types";

/**
 * Provider Interface — the contract every provider adapter MUST fulfil.
 *
 * The rest of the application only depends on this interface,
 * never on a concrete implementation.
 */
export interface Provider {
  /** Unique provider identifier, e.g. "fake" or "telna". */
  readonly name: string;

  // ─── Product / Catalog ───

  /** Fetch the full product catalogue from the provider. */
  fetchProducts(): Promise<ProviderProduct[]>;

  /** Fetch supported countries with regions. */
  fetchCountries(): Promise<ProviderCountry[]>;

  /** Fetch supported regions for a country. */
  fetchRegions(countryCode: string): Promise<ProviderCountry["regions"]>;

  // ─── Orders ───

  /** Submit a new order to the provider. */
  createOrder(request: ProviderOrderRequest): Promise<ProviderOrderResult>;

  /** Query the current status of an order. */
  getOrderStatus(providerOrderId: string): Promise<ProviderOrderResult>;

  /** Cancel a pending or processing order. */
  cancelOrder(providerOrderId: string): Promise<ProviderOrderResult>;

  // ─── eSIM Lifecycle ───

  /** Activate an eSIM (returns QR code and activation code). */
  activateEsim(iccid: string): Promise<ProviderEsimActivation>;

  /** Get full details for an eSIM by ICCID. */
  getEsimDetails(iccid: string): Promise<ProviderEsimDetails>;

  /** Get the QR code URL as a string. */
  getQrCode(iccid: string): Promise<string>;

  /** Suspend an eSIM. */
  suspendEsim(iccid: string): Promise<ProviderEsimDetails>;

  /** Reactivate a suspended eSIM. */
  reactivateEsim(iccid: string): Promise<ProviderEsimDetails>;

  /** Terminate an eSIM. */
  terminateEsim(iccid: string): Promise<ProviderEsimDetails>;

  // ─── Usage ───

  /** Get detailed usage records for an eSIM in a date range. */
  getUsageRecords(
    iccid: string,
    from: string,
    to: string,
  ): Promise<ProviderUsageRecord[]>;

  /** Get a usage summary for an eSIM. */
  getUsageSummary(
    iccid: string,
    periodStart?: string,
    periodEnd?: string,
  ): Promise<ProviderUsageSummary>;

  // ─── Webhooks ───

  /** Process an incoming webhook event from the provider. */
  handleWebhook(payload: ProviderWebhookPayload): Promise<void>;
}




