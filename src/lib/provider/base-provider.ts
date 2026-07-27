





import { getLogger, type Logger } from "@/lib/logger";
import type { Provider } from "./provider-interface";
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
import {
  normalizeDate,
  normalizeOrderStatus,
  normalizeEsimStatus,
} from "./dto";
import {
  ProviderConnectionError,
  ProviderTimeoutError,
  ProviderValidationError,
} from "./errors";

/**
 * Base Provider — shared behaviour that every provider adapter inherits.
 *
 * Concrete providers only need to implement the "raw" methods
 * (prefixed with `_`). The base class handles logging, error
 * wrapping, and DTO normalisation.
 */
export abstract class BaseProvider implements Provider {
  public abstract readonly name: string;
  protected logger: Logger;

  constructor() {
    this.logger = getLogger().child({ provider: this.name });
  }

  // ─── Abstract (must implement) ───

  protected abstract _fetchProducts(): Promise<ProviderProduct[]>;
  protected abstract _fetchCountries(): Promise<ProviderCountry[]>;
  protected abstract _fetchRegions(countryCode: string): Promise<ProviderCountry["regions"]>;
  protected abstract _createOrder(request: ProviderOrderRequest): Promise<ProviderOrderResult>;
  protected abstract _getOrderStatus(providerOrderId: string): Promise<ProviderOrderResult>;
  protected abstract _cancelOrder(providerOrderId: string): Promise<ProviderOrderResult>;
  protected abstract _activateEsim(iccid: string): Promise<ProviderEsimActivation>;
  protected abstract _getEsimDetails(iccid: string): Promise<ProviderEsimDetails>;
  protected abstract _suspendEsim(iccid: string): Promise<ProviderEsimDetails>;
  protected abstract _reactivateEsim(iccid: string): Promise<ProviderEsimDetails>;
  protected abstract _terminateEsim(iccid: string): Promise<ProviderEsimDetails>;
  protected abstract _getUsageRecords(
    iccid: string,
    from: string,
    to: string,
  ): Promise<ProviderUsageRecord[]>;
  protected abstract _getUsageSummary(
    iccid: string,
    periodStart?: string,
    periodEnd?: string,
  ): Promise<ProviderUsageSummary>;
  protected abstract _handleWebhook(payload: ProviderWebhookPayload): Promise<void>;

  // ─── Public API (wraps abstract methods with error handling & logging) ───

  async fetchProducts(): Promise<ProviderProduct[]> {
    return this.wrap("fetchProducts", () => this._fetchProducts());
  }

  async fetchCountries(): Promise<ProviderCountry[]> {
    return this.wrap("fetchCountries", () => this._fetchCountries());
  }

  async fetchRegions(countryCode: string): Promise<ProviderCountry["regions"]> {
    return this.wrap("fetchRegions", () => this._fetchRegions(countryCode));
  }

  async createOrder(request: ProviderOrderRequest): Promise<ProviderOrderResult> {
    return this.wrap("createOrder", () => this._createOrder(request));
  }

  async getOrderStatus(providerOrderId: string): Promise<ProviderOrderResult> {
    return this.wrap("getOrderStatus", () => this._getOrderStatus(providerOrderId));
  }

  async cancelOrder(providerOrderId: string): Promise<ProviderOrderResult> {
    return this.wrap("cancelOrder", () => this._cancelOrder(providerOrderId));
  }

  async activateEsim(iccid: string): Promise<ProviderEsimActivation> {
    return this.wrap("activateEsim", () => this._activateEsim(iccid));
  }

  async getEsimDetails(iccid: string): Promise<ProviderEsimDetails> {
    return this.wrap("getEsimDetails", () => this._getEsimDetails(iccid));
  }

  async getQrCode(iccid: string): Promise<string> {
    const details = await this.getEsimDetails(iccid);
    if (!details.qrCodeUrl) {
      throw new ProviderValidationError(this.name, `eSIM ${iccid} için QR kodu bulunamadı`);
    }
    return details.qrCodeUrl;
  }

  async suspendEsim(iccid: string): Promise<ProviderEsimDetails> {
    return this.wrap("suspendEsim", () => this._suspendEsim(iccid));
  }

  async reactivateEsim(iccid: string): Promise<ProviderEsimDetails> {
    return this.wrap("reactivateEsim", () => this._reactivateEsim(iccid));
  }

  async terminateEsim(iccid: string): Promise<ProviderEsimDetails> {
    return this.wrap("terminateEsim", () => this._terminateEsim(iccid));
  }

  async getUsageRecords(
    iccid: string,
    from: string,
    to: string,
  ): Promise<ProviderUsageRecord[]> {
    return this.wrap("getUsageRecords", () => this._getUsageRecords(iccid, from, to));
  }

  async getUsageSummary(
    iccid: string,
    periodStart?: string,
    periodEnd?: string,
  ): Promise<ProviderUsageSummary> {
    return this.wrap("getUsageSummary", () =>
      this._getUsageSummary(iccid, periodStart, periodEnd),
    );
  }

  async handleWebhook(payload: ProviderWebhookPayload): Promise<void> {
    return this.wrap("handleWebhook", () => this._handleWebhook(payload));
  }

  // ─── Helpers ───

  /**
   * Wrap every provider call with:
   *   1. Logging (start / success / error)
   *   2. Generic error → ProviderError conversion
   *   3. Timeout protection
   */
  protected async wrap<T>(
    method: string,
    fn: () => Promise<T>,
    timeoutMs = 15_000,
  ): Promise<T> {
    const start = Date.now();
    this.logger.debug({ method }, "Provider call started");

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new ProviderTimeoutError(this.name)), timeoutMs),
        ),
      ]);

      const duration = Date.now() - start;
      this.logger.debug({ method, duration }, "Provider call succeeded");
      return result;
    } catch (error) {
      const duration = Date.now() - start;

      // Already a ProviderError → just re-throw
      if (error instanceof ProviderConnectionError ||
          error instanceof ProviderTimeoutError ||
          error instanceof ProviderValidationError) {
        this.logger.error({ method, duration, err: error }, "Provider call failed");
        throw error;
      }

      if (error instanceof Error && error.name === "ProviderError") {
        this.logger.error({ method, duration, err: error }, "Provider call failed");
        throw error;
      }

      // Unknown error → wrap
      this.logger.error({ method, duration, err: error }, "Provider call failed (unexpected)");
      throw new ProviderConnectionError(
        this.name,
        error instanceof Error ? error.message : "Beklenmeyen sağlayıcı hatası",
      );
    }
  }

  /** Helper: normalise an order result's fields. */
  protected normalizeOrder(result: ProviderOrderResult): ProviderOrderResult {
    return {
      ...result,
      status: normalizeOrderStatus(result.status),
      createdAt: normalizeDate(result.createdAt),
      items: result.items.map((item) => ({
        ...item,
        status: normalizeOrderStatus(item.status),
      })),
    };
  }

  /** Helper: normalise eSIM details fields. */
  protected normalizeEsimDetails(details: ProviderEsimDetails): ProviderEsimDetails {
    return {
      ...details,
      status: normalizeEsimStatus(details.status),
      activatedAt: details.activatedAt ? normalizeDate(details.activatedAt) : null,
      expiresAt: details.expiresAt ? normalizeDate(details.expiresAt) : null,
      createdAt: normalizeDate(details.createdAt),
    };
  }
}





