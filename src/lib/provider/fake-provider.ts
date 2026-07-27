








import { BaseProvider } from "./base-provider";
import { generateFakeIccid } from "./dto";
import type {
  ProviderProduct,
  ProviderCountry,
  ProviderOrderRequest,
  ProviderOrderResult,
  ProviderOrderItem,
  ProviderEsimDetails,
  ProviderEsimActivation,
  ProviderUsageRecord,
  ProviderUsageSummary,
  ProviderWebhookPayload,
  OrderStatus,
  EsimStatus,
} from "./types";
import {
  ProviderProductNotFoundError,
  ProviderOrderNotFoundError,
  ProviderEsimNotFoundError,
  ProviderWebhookError,
} from "./errors";

// ─── In-memory storage ───

interface FakeOrder {
  providerOrderId: string;
  status: OrderStatus;
  items: FakeOrderItem[];
  createdAt: string;
}

interface FakeOrderItem {
  providerItemId: string;
  iccid: string;
  status: OrderStatus;
  activationCode: string;
  qrCodeUrl: string;
  smdpAddress: string;
}

interface FakeEsim {
  iccid: string;
  status: EsimStatus;
  imsi: string;
  msisdn: string | null;
  activationCode: string;
  qrCodeUrl: string;
  smdpAddress: string;
  productName: string;
  dataTotalMB: number;
  dataUsedMB: number;
  voiceTotalMinutes: number;
  voiceUsedMinutes: number;
  smsTotal: number;
  smsUsed: number;
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  periodStart: string;
  periodEnd: string;
}

// ─── Webhook callback (set by the app to persist status changes) ───

export type WebhookCallback = (
  eventType: string,
  data: Record<string, unknown>,
) => Promise<void>;

// ─── Fake Product Catalogue ───

const FAKE_PRODUCTS: ProviderProduct[] = [
  // Turkey
  { id: "fake-tr-1gb-7d",  name: "Türkiye 1GB 7 Gün",   description: "Türkiye için 1GB eSIM paketi",     type: "ESIM", country: "TR", region: null,  currency: "USD", price: 4.99,  costPrice: 2.50,  dataAmountMB: 1024,  durationDays: 7,  specifications: { networkType: "4G", tethering: true } },
  { id: "fake-tr-3gb-15d", name: "Türkiye 3GB 15 Gün",  description: "Türkiye için 3GB eSIM paketi",     type: "ESIM", country: "TR", region: null,  currency: "USD", price: 9.99,  costPrice: 5.00,  dataAmountMB: 3072,  durationDays: 15, specifications: { networkType: "4G", tethering: true } },
  { id: "fake-tr-5gb-30d", name: "Türkiye 5GB 30 Gün",  description: "Türkiye için 5GB eSIM paketi",     type: "ESIM", country: "TR", region: null,  currency: "USD", price: 14.99, costPrice: 7.50,  dataAmountMB: 5120,  durationDays: 30, specifications: { networkType: "5G", tethering: true } },
  { id: "fake-tr-10gb-30d",name: "Türkiye 10GB 30 Gün", description: "Türkiye için 10GB eSIM paketi",    type: "ESIM", country: "TR", region: null,  currency: "USD", price: 24.99, costPrice: 12.50, dataAmountMB: 10240, durationDays: 30, specifications: { networkType: "5G", tethering: true } },
  { id: "fake-tr-unl-30d", name: "Türkiye Sınırsız 30 Gün", description: "Türkiye sınırsız data paketi", type: "ESIM", country: "TR", region: null,  currency: "USD", price: 39.99, costPrice: 20.00, dataAmountMB: null,   durationDays: 30, specifications: { networkType: "5G", throttling: "50GB sonrası 1Mbps", tethering: true } },

  // USA
  { id: "fake-us-3gb-15d", name: "USA 3GB 15 Days",  description: "USA eSIM with 3GB data",      type: "ESIM", country: "US", region: null, currency: "USD", price: 12.99, costPrice: 6.00,  dataAmountMB: 3072,  durationDays: 15, specifications: { networkType: "5G", tethering: true } },
  { id: "fake-us-10gb-30d",name: "USA 10GB 30 Days", description: "USA eSIM with 10GB data",     type: "ESIM", country: "US", region: null, currency: "USD", price: 29.99, costPrice: 15.00, dataAmountMB: 10240, durationDays: 30, specifications: { networkType: "5G", tethering: true } },

  // UK
  { id: "fake-gb-3gb-15d", name: "UK 3GB 15 Days",  description: "UK eSIM with 3GB data",     type: "ESIM", country: "GB", region: null, currency: "USD", price: 11.99, costPrice: 5.50,  dataAmountMB: 3072,  durationDays: 15, specifications: { networkType: "4G", tethering: true } },
  { id: "fake-gb-10gb-30d",name: "UK 10GB 30 Days", description: "UK eSIM with 10GB data",   type: "ESIM", country: "GB", region: null, currency: "USD", price: 26.99, costPrice: 13.00, dataAmountMB: 10240, durationDays: 30, specifications: { networkType: "5G", tethering: true } },

  // UAE
  { id: "fake-ae-1gb-7d",  name: "UAE 1GB 7 Days",  description: "BAE için 1GB eSIM paketi", type: "ESIM", country: "AE", region: null,  currency: "USD", price: 6.99,  costPrice: 3.00,  dataAmountMB: 1024,  durationDays: 7,  specifications: { networkType: "5G", tethering: true } },
  { id: "fake-ae-5gb-30d", name: "UAE 5GB 30 Days", description: "BAE için 5GB eSIM paketi", type: "ESIM", country: "AE", region: null,  currency: "USD", price: 18.99, costPrice: 9.00,  dataAmountMB: 5120,  durationDays: 30, specifications: { networkType: "5G", tethering: true } },

  // Germany
  { id: "fake-de-3gb-15d", name: "Germany 3GB 15 Days", description: "Almanya 3GB eSIM", type: "ESIM", country: "DE", region: null, currency: "USD", price: 10.99, costPrice: 5.00, dataAmountMB: 3072, durationDays: 15, specifications: { networkType: "4G", tethering: true } },

  // Global / Multi-country
  { id: "fake-glb-5gb-30d", name: "Global 5GB 30 Days", description: "50+ ülkede geçerli eSIM", type: "ESIM", country: "GLOBAL", region: null, currency: "USD", price: 34.99, costPrice: 17.50, dataAmountMB: 5120, durationDays: 30, specifications: { networkType: "4G", coverage: ["TR","US","GB","AE","DE","FR","IT","ES","JP"], tethering: true } },
];

const FAKE_COUNTRIES: ProviderCountry[] = [
  { code: "TR", name: "Türkiye",   flag: "🇹🇷", regions: [{ code: "TR-IST", name: "İstanbul" }, { code: "TR-ANK", name: "Ankara" }] },
  { code: "US", name: "ABD",       flag: "🇺🇸", regions: [] },
  { code: "GB", name: "Birleşik Krallık", flag: "🇬🇧", regions: [] },
  { code: "AE", name: "BAE",       flag: "🇦🇪", regions: [{ code: "AE-DXB", name: "Dubai" }, { code: "AE-AUH", name: "Abu Dabi" }] },
  { code: "DE", name: "Almanya",   flag: "🇩🇪", regions: [] },
  { code: "GLOBAL", name: "Global", flag: "🌍", regions: [] },
];

let orderCounter = 1000;
let esimCounter = 0;

// ─── Fake Provider ───

export class FakeProvider extends BaseProvider {
  readonly name = "fake";

  private orders = new Map<string, FakeOrder>();
  private esims = new Map<string, FakeEsim>();

  /** Optional webhook callback — called after async status transitions. */
  private onWebhook: WebhookCallback | null = null;

  constructor(webhookCallback?: WebhookCallback) {
    super();
    this.onWebhook = webhookCallback ?? null;
  }

  /** Replace the webhook callback at runtime. */
  setWebhookCallback(cb: WebhookCallback): void {
    this.onWebhook = cb;
  }

  // ─── Product / Catalog ───

  protected async _fetchProducts(): Promise<ProviderProduct[]> {
    return [...FAKE_PRODUCTS];
  }

  protected async _fetchCountries(): Promise<ProviderCountry[]> {
    return [...FAKE_COUNTRIES];
  }

  protected async _fetchRegions(countryCode: string): Promise<ProviderCountry["regions"]> {
    const country = FAKE_COUNTRIES.find((c) => c.code === countryCode.toUpperCase());
    return country?.regions ?? [];
  }

  // ─── Orders ───

  protected async _createOrder(request: ProviderOrderRequest): Promise<ProviderOrderResult> {
    const product = FAKE_PRODUCTS.find((p) => p.id === request.productId);
    if (!product) {
      throw new ProviderProductNotFoundError(this.name, request.productId);
    }

    const orderId = `FAKE-ORD-${++orderCounter}`;
    const items: FakeOrderItem[] = [];

    for (let i = 0; i < request.quantity; i++) {
      const itemId = `${orderId}-${i + 1}`;
      const iccid = generateFakeIccid(++esimCounter);
      const lpa = this.generateLpa(iccid);

      items.push({
        providerItemId: itemId,
        iccid,
        status: "PROCESSING",
        activationCode: lpa.activationCode,
        qrCodeUrl: lpa.qrCodeUrl,
        smdpAddress: lpa.smdpAddress,
      });

      // Create eSIM record
      const now = new Date();
      const durationDays = product.durationDays ?? 30;
      this.esims.set(iccid, {
        iccid,
        status: "INACTIVE",
        imsi: this.generateImsi(),
        msisdn: null,
        activationCode: lpa.activationCode,
        qrCodeUrl: lpa.qrCodeUrl,
        smdpAddress: lpa.smdpAddress,
        productName: product.name,
        dataTotalMB: product.dataAmountMB ?? 0,
        dataUsedMB: 0,
        voiceTotalMinutes: product.type === "VOICE_BUNDLE" ? 120 : 0,
        voiceUsedMinutes: 0,
        smsTotal: product.type === "VOICE_BUNDLE" ? 100 : 0,
        smsUsed: 0,
        createdAt: now.toISOString(),
        activatedAt: null,
        expiresAt: null,
        periodStart: now.toISOString(),
        periodEnd: new Date(now.getTime() + durationDays * 86400000).toISOString(),
      });
    }

    const order: FakeOrder = {
      providerOrderId: orderId,
      status: "PROCESSING",
      items,
      createdAt: new Date().toISOString(),
    };
    this.orders.set(orderId, order);

    // Simulate async completion after 2-5 seconds
    const delay = 2000 + Math.floor(Math.random() * 3000);
    setTimeout(() => this.completeOrder(orderId), delay);

    return this.normalizeOrder({
      providerOrderId: order.providerOrderId,
      status: order.status,
      items: order.items.map((it) => ({
        providerItemId: it.providerItemId,
        iccid: it.iccid,
        status: it.status,
        qrCodeUrl: it.qrCodeUrl,
        activationCode: it.activationCode,
        smdpAddress: it.smdpAddress,
      })),
      createdAt: order.createdAt,
    });
  }

  protected async _getOrderStatus(providerOrderId: string): Promise<ProviderOrderResult> {
    const order = this.orders.get(providerOrderId);
    if (!order) {
      throw new ProviderOrderNotFoundError(this.name, providerOrderId);
    }

    return {
      providerOrderId: order.providerOrderId,
      status: order.status,
      items: order.items.map((it) => ({
        providerItemId: it.providerItemId,
        iccid: it.iccid,
        status: it.status,
        qrCodeUrl: it.qrCodeUrl,
        activationCode: it.activationCode,
        smdpAddress: it.smdpAddress,
      })),
      createdAt: order.createdAt,
    };
  }

  protected async _cancelOrder(providerOrderId: string): Promise<ProviderOrderResult> {
    const order = this.orders.get(providerOrderId);
    if (!order) {
      throw new ProviderOrderNotFoundError(this.name, providerOrderId);
    }

    if (order.status === "COMPLETED" || order.status === "CANCELLED" || order.status === "REFUNDED") {
      throw new ProviderWebhookError(this.name, "cancel", `Sipariş ${order.status} durumunda iptal edilemez`);
    }

    order.status = "CANCELLED";
    for (const item of order.items) {
      item.status = "CANCELLED";
      const esim = this.esims.get(item.iccid);
      if (esim) esim.status = "TERMINATED";
    }

    return {
      providerOrderId: order.providerOrderId,
      status: order.status,
      items: order.items.map((it) => ({
        providerItemId: it.providerItemId,
        iccid: it.iccid,
        status: it.status,
        qrCodeUrl: it.qrCodeUrl,
        activationCode: it.activationCode,
        smdpAddress: it.smdpAddress,
      })),
      createdAt: order.createdAt,
    };
  }

  // ─── eSIM Lifecycle ───

  protected async _getEsimDetails(iccid: string): Promise<ProviderEsimDetails> {
    const esim = this.esims.get(iccid);
    if (!esim) {
      throw new ProviderEsimNotFoundError(this.name, iccid);
    }
    return this.toEsimDetails(esim);
  }

  protected async _activateEsim(iccid: string): Promise<ProviderEsimActivation> {
    const esim = this.esims.get(iccid);
    if (!esim) {
      throw new ProviderEsimNotFoundError(this.name, iccid);
    }

    esim.status = "ACTIVE";
    esim.activatedAt = new Date().toISOString();

    return {
      iccid: esim.iccid,
      activationCode: esim.activationCode,
      qrCodeUrl: esim.qrCodeUrl,
      smdpAddress: esim.smdpAddress,
    };
  }

  protected async _suspendEsim(iccid: string): Promise<ProviderEsimDetails> {
    const esim = this.esims.get(iccid);
    if (!esim) throw new ProviderEsimNotFoundError(this.name, iccid);
    esim.status = "SUSPENDED";
    return this.toEsimDetails(esim);
  }

  protected async _reactivateEsim(iccid: string): Promise<ProviderEsimDetails> {
    const esim = this.esims.get(iccid);
    if (!esim) throw new ProviderEsimNotFoundError(this.name, iccid);
    esim.status = "ACTIVE";
    return this.toEsimDetails(esim);
  }

  protected async _terminateEsim(iccid: string): Promise<ProviderEsimDetails> {
    const esim = this.esims.get(iccid);
    if (!esim) throw new ProviderEsimNotFoundError(this.name, iccid);
    esim.status = "TERMINATED";
    return this.toEsimDetails(esim);
  }

  // ─── Usage ───

  protected async _getUsageRecords(
    iccid: string,
    from: string,
    to: string,
  ): Promise<ProviderUsageRecord[]> {
    const esim = this.esims.get(iccid);
    if (!esim) throw new ProviderEsimNotFoundError(this.name, iccid);

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const days = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000));
    const dayMs = 86400000;

    const records: ProviderUsageRecord[] = [];
    for (let i = 0; i < days; i++) {
      const day = new Date(fromDate.getTime() + i * dayMs);
      records.push({
        type: "DATA",
        usedAmount: this.randomBetween(10, 200),
        totalAmount: esim.dataTotalMB,
        unit: "MB",
        remainingAmount: Math.max(0, esim.dataTotalMB - esim.dataUsedMB),
        periodStart: day.toISOString(),
        periodEnd: new Date(day.getTime() + dayMs).toISOString(),
      });
    }
    return records;
  }

  protected async _getUsageSummary(
    iccid: string,
    _periodStart?: string,
    _periodEnd?: string,
  ): Promise<ProviderUsageSummary> {
    const esim = this.esims.get(iccid);
    if (!esim) throw new ProviderEsimNotFoundError(this.name, iccid);

    // Simulate some usage
    const newUsed = Math.min(esim.dataTotalMB, esim.dataUsedMB + this.randomBetween(5, 100));
    esim.dataUsedMB = newUsed;
    esim.voiceUsedMinutes = Math.min(esim.voiceTotalMinutes, esim.voiceUsedMinutes + this.randomBetween(0, 5));
    esim.smsUsed = Math.min(esim.smsTotal, esim.smsUsed + this.randomBetween(0, 2));

    return {
      iccid: esim.iccid,
      dataUsedMB: esim.dataUsedMB,
      dataTotalMB: esim.dataTotalMB,
      voiceUsedMinutes: esim.voiceUsedMinutes,
      voiceTotalMinutes: esim.voiceTotalMinutes,
      smsUsed: esim.smsUsed,
      smsTotal: esim.smsTotal,
      periodStart: esim.periodStart,
      periodEnd: esim.periodEnd,
    };
  }

  // ─── Webhook ───

  protected async _handleWebhook(payload: ProviderWebhookPayload): Promise<void> {
    throw new ProviderWebhookError(
      this.name,
      payload.eventType,
      "Fake provider dış webhook kabul etmez — webhook'lar dahili olarak tetiklenir",
    );
  }

  // ─── Private helpers ───

  private async completeOrder(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order || order.status !== "PROCESSING") return;

    order.status = "COMPLETED";
    for (const item of order.items) {
      item.status = "COMPLETED";
    }

    this.logger.info({ orderId }, "Fake order completed (async)");

    // Fire webhook callback if registered
    if (this.onWebhook) {
      try {
        await this.onWebhook("order.status_changed", {
          providerOrderId: orderId,
          status: "COMPLETED",
          items: order.items.map((it) => ({
            providerItemId: it.providerItemId,
            iccid: it.iccid,
            status: it.status,
          })),
        });
      } catch (err) {
        this.logger.error({ err, orderId }, "Webhook callback failed");
      }
    }
  }

  private generateLpa(iccid: string): { activationCode: string; qrCodeUrl: string; smdpAddress: string } {
    const smdp = "smdp.fake-esim.io";
    const matchingId = `FAKE-${iccid.slice(-6)}`;
    const activationCode = `${matchingId}-CODE`;
    // LPA format: LPA:1${smdp}${matchingId}
    const qrContent = `LPA:1$${smdp}$${matchingId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrContent)}`;
    return { activationCode, qrCodeUrl, smdpAddress: smdp };
  }

  private generateImsi(): string {
    const prefix = "90170"; // Shared MNC-MCC for global IoT
    const serial = String(Math.floor(Math.random() * 10_000_000_000)).padStart(10, "0");
    return prefix + serial;
  }

  private toEsimDetails(esim: FakeEsim): ProviderEsimDetails {
    return {
      iccid: esim.iccid,
      status: esim.status,
      imsi: esim.imsi,
      msisdn: esim.msisdn,
      qrCodeUrl: esim.qrCodeUrl,
      activationCode: esim.activationCode,
      smdpAddress: esim.smdpAddress,
      productName: esim.productName,
      activatedAt: esim.activatedAt,
      expiresAt: esim.expiresAt,
      createdAt: esim.createdAt,
    };
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}








