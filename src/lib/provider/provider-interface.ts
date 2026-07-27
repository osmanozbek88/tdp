




import type {
  ProviderPlan,
  ProviderOrderRequest,
  ProviderOrderResult,
  ProviderEsimProfile,
  ProviderEsimActivation,
  ProviderUsageRecord,
  ProviderUsageSummary,
  ProviderCountry,
  ProviderSubscriber,
  CreateSubscriberRequest,
  ProviderBillingRecord,
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

  /** Fetch the full plan catalogue from the provider. */
  fetchPlans(): Promise<ProviderPlan[]>;

  /** Fetch supported countries with regions. */
  fetchCountries(): Promise<ProviderCountry[]>;

  /** Fetch supported regions for a country. */
  fetchRegions(countryCode: string): Promise<ProviderCountry["regions"]>;

  // ─── Subscriber / Account ───

  /** Register a new subscriber account with the provider. */
  createSubscriber(request: CreateSubscriberRequest): Promise<ProviderSubscriber>;

  /** Retrieve a subscriber by account ID. */
  getSubscriber(accountId: string): Promise<ProviderSubscriber>;

  /** Update subscriber status. */
  updateSubscriberStatus(accountId: string, status: ProviderSubscriber["status"]): Promise<ProviderSubscriber>;

  // ─── Orders ───

  /** Submit a new order to the provider. */
  createOrder(request: ProviderOrderRequest): Promise<ProviderOrderResult>;

  /** Query the current status of an order. */
  getOrderStatus(providerOrderId: string): Promise<ProviderOrderResult>;

  /** Cancel a pending or provisioning order. */
  cancelOrder(providerOrderId: string): Promise<ProviderOrderResult>;

  // ─── eSIM Lifecycle (GSMA SGP.02 / SGP.22) ───

  /** Get full eSIM profile details by ICCID. */
  getEsimProfile(iccid: string): Promise<ProviderEsimProfile>;

  /** Activate an eSIM — transition released → downloaded. */
  activateEsim(iccid: string): Promise<ProviderEsimActivation>;

  /** Get the QR code URL as a string. */
  getQrCode(iccid: string): Promise<string>;

  /** Disable (suspend) an active eSIM. */
  disableEsim(iccid: string): Promise<ProviderEsimProfile>;

  /** Re‑enable a disabled eSIM. */
  enableEsim(iccid: string): Promise<ProviderEsimProfile>;

  /** Permanently delete an eSIM profile. */
  deleteEsim(iccid: string): Promise<ProviderEsimProfile>;

  // ─── Usage ───

  /** Get detailed usage / CDR records for an eSIM in a date range. */
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

  // ─── Billing ───

  /** Get billing / invoice records for a subscriber. */
  getBillingRecords(
    accountId: string,
    periodStart?: string,
    periodEnd?: string,
  ): Promise<ProviderBillingRecord[]>;

  // ─── Webhooks ───

  /** Process an incoming provider webhook. */
  handleWebhook(payload: ProviderWebhookPayload): Promise<void>;
}




