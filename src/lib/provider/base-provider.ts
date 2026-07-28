





import { getLogger, type Logger } from "@/lib/logger";
import type { Provider } from "./provider-interface";
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

  protected abstract _fetchPlans(): Promise<ProviderPlan[]>;
  protected abstract _fetchCountries(): Promise<ProviderCountry[]>;
  protected abstract _fetchRegions(countryCode: string): Promise<ProviderCountry["regions"]>;
  protected abstract _createSubscriber(request: CreateSubscriberRequest): Promise<ProviderSubscriber>;
  protected abstract _getSubscriber(accountId: string): Promise<ProviderSubscriber>;
  protected abstract _updateSubscriberStatus(accountId: string, status: ProviderSubscriber["status"]): Promise<ProviderSubscriber>;
  protected abstract _createOrder(request: ProviderOrderRequest): Promise<ProviderOrderResult>;
  protected abstract _getOrderStatus(providerOrderId: string): Promise<ProviderOrderResult>;
  protected abstract _cancelOrder(providerOrderId: string): Promise<ProviderOrderResult>;
  protected abstract _getEsimProfile(iccid: string): Promise<ProviderEsimProfile>;
  protected abstract _activateEsim(iccid: string): Promise<ProviderEsimActivation>;
  protected abstract _disableEsim(iccid: string): Promise<ProviderEsimProfile>;
  protected abstract _enableEsim(iccid: string): Promise<ProviderEsimProfile>;
  protected abstract _deleteEsim(iccid: string): Promise<ProviderEsimProfile>;
  protected abstract _getUsageRecords(iccid: string, from: string, to: string): Promise<ProviderUsageRecord[]>;
  protected abstract _getUsageSummary(iccid: string, periodStart?: string, periodEnd?: string): Promise<ProviderUsageSummary>;
  protected abstract _getBillingRecords(accountId: string, periodStart?: string, periodEnd?: string): Promise<ProviderBillingRecord[]>;
  protected abstract _handleWebhook(payload: ProviderWebhookPayload): Promise<void>;

  // ─── Public API ───

  async fetchPlans(): Promise<ProviderPlan[]> {
    return this.wrap("fetchPlans", () => this._fetchPlans());
  }

  async fetchCountries(): Promise<ProviderCountry[]> {
    return this.wrap("fetchCountries", () => this._fetchCountries());
  }

  async fetchRegions(countryCode: string): Promise<ProviderCountry["regions"]> {
    return this.wrap("fetchRegions", () => this._fetchRegions(countryCode));
  }

  // ─── Product / Catalog aliases (FAZ 4 checklist names) ───

  async getProducts(): Promise<ProviderPlan[]> {
    return this.fetchPlans();
  }

  async getCountries(): Promise<ProviderCountry[]> {
    return this.fetchCountries();
  }

  async getRegions(countryCode: string): Promise<ProviderCountry["regions"]> {
    return this.fetchRegions(countryCode);
  }

  async createSubscriber(request: CreateSubscriberRequest): Promise<ProviderSubscriber> {
    return this.wrap("createSubscriber", () => this._createSubscriber(request));
  }

  async getSubscriber(accountId: string): Promise<ProviderSubscriber> {
    return this.wrap("getSubscriber", () => this._getSubscriber(accountId));
  }

  async updateSubscriberStatus(accountId: string, status: ProviderSubscriber["status"]): Promise<ProviderSubscriber> {
    return this.wrap("updateSubscriberStatus", () => this._updateSubscriberStatus(accountId, status));
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

  async getEsimProfile(iccid: string): Promise<ProviderEsimProfile> {
    return this.wrap("getEsimProfile", () => this._getEsimProfile(iccid));
  }

  // ─── eSIM alias (FAZ 4 checklist name) ───

  async getEsimDetails(iccid: string): Promise<ProviderEsimProfile> {
    return this.getEsimProfile(iccid);
  }

  async activateEsim(iccid: string): Promise<ProviderEsimActivation> {
    return this.wrap("activateEsim", () => this._activateEsim(iccid));
  }

  async getQrCode(iccid: string): Promise<string> {
    const profile = await this.getEsimProfile(iccid);
    if (!profile.qrCodeUrl) {
      throw new ProviderValidationError(this.name, `eSIM ${iccid} için QR kodu bulunamadı`);
    }
    return profile.qrCodeUrl;
  }

  async disableEsim(iccid: string): Promise<ProviderEsimProfile> {
    return this.wrap("disableEsim", () => this._disableEsim(iccid));
  }

  async enableEsim(iccid: string): Promise<ProviderEsimProfile> {
    return this.wrap("enableEsim", () => this._enableEsim(iccid));
  }

  async deleteEsim(iccid: string): Promise<ProviderEsimProfile> {
    return this.wrap("deleteEsim", () => this._deleteEsim(iccid));
  }

  async getUsageRecords(iccid: string, from: string, to: string): Promise<ProviderUsageRecord[]> {
    return this.wrap("getUsageRecords", () => this._getUsageRecords(iccid, from, to));
  }

  async getUsageSummary(iccid: string, periodStart?: string, periodEnd?: string): Promise<ProviderUsageSummary> {
    return this.wrap("getUsageSummary", () => this._getUsageSummary(iccid, periodStart, periodEnd));
  }

  // ─── Usage alias (FAZ 4 checklist name) ───

  async getUsage(iccid: string, periodStart?: string, periodEnd?: string): Promise<ProviderUsageSummary> {
    return this.getUsageSummary(iccid, periodStart, periodEnd);
  }

  async getBillingRecords(accountId: string, periodStart?: string, periodEnd?: string): Promise<ProviderBillingRecord[]> {
    return this.wrap("getBillingRecords", () => this._getBillingRecords(accountId, periodStart, periodEnd));
  }

  async handleWebhook(payload: ProviderWebhookPayload): Promise<void> {
    return this.wrap("handleWebhook", () => this._handleWebhook(payload));
  }

  // ─── Helpers ───

  protected async wrap<T>(method: string, fn: () => Promise<T>, timeoutMs = 15_000): Promise<T> {
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

      this.logger.error({ method, duration, err: error }, "Provider call failed (unexpected)");
      throw new ProviderConnectionError(
        this.name,
        error instanceof Error ? error.message : "Beklenmeyen sağlayıcı hatası",
      );
    }
  }

  /** Normalise an order result's fields. */
  protected normalizeOrder(result: ProviderOrderResult): ProviderOrderResult {
    return {
      ...result,
      status: normalizeOrderStatus(result.status),
      createdAt: normalizeDate(result.createdAt),
      activatedAt: result.activatedAt ? normalizeDate(result.activatedAt) : null,
      items: result.items.map((item) => ({
        ...item,
        status: normalizeOrderStatus(item.status),
      })),
    };
  }

  /** Normalise eSIM profile fields. */
  protected normalizeEsimProfile(profile: ProviderEsimProfile): ProviderEsimProfile {
    return {
      ...profile,
      profileStatus: normalizeEsimStatus(profile.profileStatus),
      createdAt: normalizeDate(profile.createdAt),
      updatedAt: normalizeDate(profile.updatedAt),
    };
  }
}





