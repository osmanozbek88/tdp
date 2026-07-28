








import { BaseProvider } from "./base-provider";
import {
  generateFakeIccid,
  generateFakeEid,
  generateFakeImsi,
  generateFakeMsisdn,
  buildActivationCode,
  isValidIccid,
} from "./dto";
import type {
  ProviderPlan,
  ProviderCountry,
  ProviderOrderRequest,
  ProviderOrderResult,
  ProviderOrderItem,
  ProviderEsimProfile,
  ProviderEsimActivation,
  ProviderUsageRecord,
  ProviderUsageSummary,
  ProviderSubscriber,
  CreateSubscriberRequest,
  ProviderBillingRecord,
  ProviderWebhookPayload,
  ProviderWebhookEnvelope,
  OrderStatus,
  GsmEsimStatus,
  SubscriberStatus,
  UsageRecordType,
  PlanType,
} from "./types";
import {
  ProviderProductNotFoundError,
  ProviderOrderNotFoundError,
  ProviderEsimNotFoundError,
  ProviderWebhookError,
  ProviderValidationError,
} from "./errors";

// ═══════════════════════════════════════════════════════════════
// Internal (in‑memory) data structures
// ═══════════════════════════════════════════════════════════════

interface FakeSubscriber {
  accountId: string;
  externalRef: string;
  email: string;
  countryCode: string;
  status: SubscriberStatus;
  createdAt: string;
  updatedAt: string;
}

interface FakeEsim {
  iccid: string;
  eid: string | null;       // Bound eUICC identity, null until device binds
  imsi: string;
  msisdn: string | null;
  activationCode: string;
  qrCodeUrl: string;
  smdpAddress: string;
  matchingId: string;
  profileStatus: GsmEsimStatus;
  apn: string | null;
  planId: string | null;
  orderId: string | null;
  subscriberId: string | null;
  dataTotalMB: number;
  dataUsedMB: number;
  voiceTotalMinutes: number;
  voiceUsedMinutes: number;
  smsTotal: number;
  smsUsed: number;
  createdAt: string;
  updatedAt: string;
  periodStart: string;
  periodEnd: string;
}

interface FakeOrder {
  orderId: string;
  subscriberId: string | null;
  planId: string;
  status: OrderStatus;
  quantity: number;
  items: FakeOrderItem[];
  createdAt: string;
  activatedAt: string | null;
}

interface FakeOrderItem {
  itemId: string;
  iccid: string | null;
  eid: string | null;
  status: OrderStatus;
  qrCodeUrl: string | null;
  activationCode: string | null;
  smdpAddress: string | null;
  matchingId: string | null;
}

// ═══════════════════════════════════════════════════════════════
// Webhook
// ═══════════════════════════════════════════════════════════════

export type WebhookCallback = (
  eventType: string,
  data: Record<string, unknown>,
) => Promise<void>;

// ═══════════════════════════════════════════════════════════════
// Fake Product Catalogue (ProviderPlan formatinde)
// ═══════════════════════════════════════════════════════════════

const FAKE_PLANS: ProviderPlan[] = [
  // Turkey
  { planId: "fake-tr-1gb-7d",   name: "Türkiye 1GB 7 Gün",    countryCoverage: ["TR"], currency: "USD", retailPrice: 4.99,  wholesalePrice: 2.50,  dataLimitMB: 1024,  validityDays: 7,  planType: "data_only", apn: "internet",      throttling: null,                tethering: true },
  { planId: "fake-tr-3gb-15d",  name: "Türkiye 3GB 15 Gün",   countryCoverage: ["TR"], currency: "USD", retailPrice: 9.99,  wholesalePrice: 5.00,  dataLimitMB: 3072,  validityDays: 15, planType: "data_only", apn: "internet",      throttling: null,                tethering: true },
  { planId: "fake-tr-5gb-30d",  name: "Türkiye 5GB 30 Gün",   countryCoverage: ["TR"], currency: "USD", retailPrice: 14.99, wholesalePrice: 7.50,  dataLimitMB: 5120,  validityDays: 30, planType: "data_only", apn: "internet",      throttling: null,                tethering: true },
  { planId: "fake-tr-10gb-30d", name: "Türkiye 10GB 30 Gün",  countryCoverage: ["TR"], currency: "USD", retailPrice: 24.99, wholesalePrice: 12.50, dataLimitMB: 10240, validityDays: 30, planType: "data_only", apn: "internet",      throttling: null,                tethering: true },
  { planId: "fake-tr-unl-30d",  name: "Türkiye Sınırsız 30 Gün", countryCoverage: ["TR"], currency: "USD", retailPrice: 39.99, wholesalePrice: 20.00, dataLimitMB: null,   validityDays: 30, planType: "data_only", apn: "internet",      throttling: "50GB sonrası 1Mbps", tethering: true },

  // USA
  { planId: "fake-us-3gb-15d",  name: "USA 3GB 15 Days",      countryCoverage: ["US"], currency: "USD", retailPrice: 12.99, wholesalePrice: 6.00,  dataLimitMB: 3072,  validityDays: 15, planType: "data_only", apn: "fast.t-mobile.com", throttling: null,     tethering: true },
  { planId: "fake-us-10gb-30d", name: "USA 10GB 30 Days",     countryCoverage: ["US"], currency: "USD", retailPrice: 29.99, wholesalePrice: 15.00, dataLimitMB: 10240, validityDays: 30, planType: "data_only", apn: "fast.t-mobile.com", throttling: null,     tethering: true },

  // UK
  { planId: "fake-gb-3gb-15d",  name: "UK 3GB 15 Days",       countryCoverage: ["GB"], currency: "USD", retailPrice: 11.99, wholesalePrice: 5.50,  dataLimitMB: 3072,  validityDays: 15, planType: "data_only", apn: "data.o2.co.uk", throttling: null,        tethering: true },
  { planId: "fake-gb-10gb-30d", name: "UK 10GB 30 Days",      countryCoverage: ["GB"], currency: "USD", retailPrice: 26.99, wholesalePrice: 13.00, dataLimitMB: 10240, validityDays: 30, planType: "data_only", apn: "data.o2.co.uk", throttling: null,        tethering: true },

  // UAE
  { planId: "fake-ae-1gb-7d",   name: "UAE 1GB 7 Days",       countryCoverage: ["AE"], currency: "USD", retailPrice: 6.99,  wholesalePrice: 3.00,  dataLimitMB: 1024,  validityDays: 7,  planType: "data_only", apn: "du",             throttling: null,     tethering: true },
  { planId: "fake-ae-5gb-30d",  name: "UAE 5GB 30 Days",      countryCoverage: ["AE"], currency: "USD", retailPrice: 18.99, wholesalePrice: 9.00,  dataLimitMB: 5120,  validityDays: 30, planType: "data_only", apn: "du",             throttling: null,     tethering: true },

  // Germany
  { planId: "fake-de-3gb-15d",  name: "Germany 3GB 15 Days",  countryCoverage: ["DE"], currency: "USD", retailPrice: 10.99, wholesalePrice: 5.00,  dataLimitMB: 3072,  validityDays: 15, planType: "data_only", apn: "internet.t-mobile.de", throttling: null, tethering: true },

  // Global
  { planId: "fake-glb-5gb-30d", name: "Global 5GB 30 Days",   countryCoverage: ["TR","US","GB","AE","DE","FR","IT","ES","JP"], currency: "USD", retailPrice: 34.99, wholesalePrice: 17.50, dataLimitMB: 5120, validityDays: 30, planType: "data_only", apn: "globaldata", throttling: null, tethering: true },
];

const FAKE_COUNTRIES: ProviderCountry[] = [
  { code: "TR", name: "Türkiye",   flag: "🇹🇷", regions: [{ code: "TR-IST", name: "İstanbul" }, { code: "TR-ANK", name: "Ankara" }, { code: "TR-ANT", name: "Antalya" }] },
  { code: "US", name: "ABD",       flag: "🇺🇸", regions: [] },
  { code: "GB", name: "Birleşik Krallık", flag: "🇬🇧", regions: [] },
  { code: "AE", name: "BAE",       flag: "🇦🇪", regions: [{ code: "AE-DXB", name: "Dubai" }, { code: "AE-AUH", name: "Abu Dabi" }] },
  { code: "DE", name: "Almanya",   flag: "🇩🇪", regions: [{ code: "DE-BER", name: "Berlin" }, { code: "DE-MUC", name: "Münih" }] },
  { code: "GLOBAL", name: "Global", flag: "🌍", regions: [] },
];

/** ISO 3166-1 alpha-2 → ISO numeric for ICCID generation. */
const COUNTRY_NUMERIC: Record<string, string> = {
  TR: "90", US: "31", GB: "44", AE: "78", DE: "49", GLOBAL: "99",
};

/** Pool of MCC‑MNC pairs used for realistic CDR records. */
const CDR_MCC_MNC_POOL: { mccMnc: string; country: string }[] = [
  { mccMnc: "28601", country: "TR" },  // Turkcell
  { mccMnc: "28602", country: "TR" },  // Vodafone TR
  { mccMnc: "28603", country: "TR" },  // Türk Telekom
  { mccMnc: "310410", country: "US" }, // AT&T
  { mccMnc: "310260", country: "US" }, // T‑Mobile
  { mccMnc: "23415", country: "GB" },  // Vodafone UK
  { mccMnc: "23410", country: "GB" },  // O2
  { mccMnc: "26201", country: "DE" },  // Telekom
  { mccMnc: "42403", country: "AE" },  // du
];

// ═══════════════════════════════════════════════════════════════
// Fake Provider
// ═══════════════════════════════════════════════════════════════

export class FakeProvider extends BaseProvider {
  readonly name = "fake";

  private subscribers = new Map<string, FakeSubscriber>();
  private esims = new Map<string, FakeEsim>();
  private orders = new Map<string, FakeOrder>();

  private onWebhook: WebhookCallback | null = null;

  /** HMAC secret for outgoing webhook signatures. */
  private readonly webhookSecret: string;

  private orderCounter = 1000;
  private subscriberCounter = 0;

  constructor(webhookCallback?: WebhookCallback) {
    super();
    this.onWebhook = webhookCallback ?? null;
    this.webhookSecret = process.env.WEBHOOK_SECRET ?? "fake-webhook-dev-secret-change-in-prod";
  }

  setWebhookCallback(cb: WebhookCallback): void {
    this.onWebhook = cb;
  }

  // ══════════════════════════════════════════════════════════
  // Catalog
  // ══════════════════════════════════════════════════════════

  protected async _fetchPlans(): Promise<ProviderPlan[]> {
    return [...FAKE_PLANS];
  }

  protected async _fetchCountries(): Promise<ProviderCountry[]> {
    return [...FAKE_COUNTRIES];
  }

  protected async _fetchRegions(countryCode: string): Promise<ProviderCountry["regions"]> {
    const country = FAKE_COUNTRIES.find((c) => c.code === countryCode.toUpperCase());
    return country?.regions ?? [];
  }

  // ══════════════════════════════════════════════════════════
  // Subscriber / Account
  // ══════════════════════════════════════════════════════════

  protected async _createSubscriber(request: CreateSubscriberRequest): Promise<ProviderSubscriber> {
    const id = ++this.subscriberCounter;
    const accountId = `fake-sub-${id}`;
    const now = new Date().toISOString();

    const subscriber: FakeSubscriber = {
      accountId,
      externalRef: request.externalRef ?? `ext-${Date.now()}`,
      email: request.email,
      countryCode: request.countryCode ?? "TR",
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    this.subscribers.set(accountId, subscriber);
    this.logger.info({ accountId, email: request.email }, "Subscriber created");
    return { ...subscriber };
  }

  protected async _getSubscriber(accountId: string): Promise<ProviderSubscriber> {
    const sub = this.subscribers.get(accountId);
    if (!sub) {
      throw new ProviderValidationError(this.name, `Subscriber bulunamadı: ${accountId}`);
    }
    return { ...sub };
  }

  protected async _updateSubscriberStatus(
    accountId: string,
    status: SubscriberStatus,
  ): Promise<ProviderSubscriber> {
    const sub = this.subscribers.get(accountId);
    if (!sub) throw new ProviderValidationError(this.name, `Subscriber bulunamadı: ${accountId}`);

    sub.status = status;
    sub.updatedAt = new Date().toISOString();
    return { ...sub };
  }

  // ══════════════════════════════════════════════════════════
  // Orders
  // ══════════════════════════════════════════════════════════

  protected async _createOrder(request: ProviderOrderRequest): Promise<ProviderOrderResult> {
    const plan = FAKE_PLANS.find((p) => p.planId === request.planId);
    if (!plan) {
      throw new ProviderProductNotFoundError(this.name, request.planId);
    }

    const orderId = `FAKE-ORD-${++this.orderCounter}`;
    const items: FakeOrderItem[] = [];

    // Ensure subscriber exists (create if needed)
    let subscriberId = request.subscriberId;
    if (!subscriberId) {
      const sub = await this._createSubscriber({
        email: request.customerEmail,
        countryCode: request.countryCode ?? plan.countryCoverage[0],
      });
      subscriberId = sub.accountId;
    }

    const countryNum = COUNTRY_NUMERIC[plan.countryCoverage[0] ?? "GLOBAL"] ?? "99";

    for (let i = 0; i < request.quantity; i++) {
      const itemId = `${orderId}-ITEM-${i + 1}`;
      const iccid = generateFakeIccid(countryNum, this.orderCounter * 100 + i);
      const matchingId = `MF-${iccid.slice(-8)}`;
      const smdpAddress = "smdp.fake-esim.io";
      const activationCode = buildActivationCode(smdpAddress, matchingId);
      const eid = generateFakeEid();

      const qrContent = activationCode;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrContent)}`;

      items.push({
        itemId,
        iccid,
        eid,
        status: "provisioning",
        qrCodeUrl,
        activationCode,
        smdpAddress,
        matchingId,
      });

      // Create GSMA‑compliant eSIM profile
      const now = new Date();
      const validityDays = plan.validityDays;
      this.esims.set(iccid, {
        iccid,
        eid,
        imsi: generateFakeImsi(),
        msisdn: null, // data‑only eSIM, MSISDN assigned later if voice
        activationCode,
        qrCodeUrl,
        smdpAddress,
        matchingId,
        profileStatus: "released",
        apn: plan.apn,
        planId: plan.planId,
        orderId,
        subscriberId,
        dataTotalMB: plan.dataLimitMB ?? 0,
        dataUsedMB: 0,
        voiceTotalMinutes: plan.planType === "voice_data" ? 120 : 0,
        voiceUsedMinutes: 0,
        smsTotal: plan.planType === "voice_data" ? 100 : 0,
        smsUsed: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        periodStart: now.toISOString(),
        periodEnd: new Date(now.getTime() + validityDays * 86400000).toISOString(),
      });
    }

    const order: FakeOrder = {
      orderId,
      subscriberId,
      planId: plan.planId,
      status: "provisioning",
      quantity: request.quantity,
      items,
      createdAt: new Date().toISOString(),
      activatedAt: null,
    };
    this.orders.set(orderId, order);

    // Simulate async provisioning → completed after 2‑5 seconds
    const delay = 2000 + Math.floor(Math.random() * 3000);
    setTimeout(() => this.completeOrderProvisioning(orderId), delay);

    return this.toOrderResult(order);
  }

  protected async _getOrderStatus(providerOrderId: string): Promise<ProviderOrderResult> {
    const order = this.orders.get(providerOrderId);
    if (!order) throw new ProviderOrderNotFoundError(this.name, providerOrderId);
    return this.toOrderResult(order);
  }

  protected async _cancelOrder(providerOrderId: string): Promise<ProviderOrderResult> {
    const order = this.orders.get(providerOrderId);
    if (!order) throw new ProviderOrderNotFoundError(this.name, providerOrderId);

    if (order.status === "completed" || order.status === "cancelled") {
      throw new ProviderValidationError(
        this.name,
        `Sipariş ${order.status} durumunda iptal edilemez`,
      );
    }

    order.status = "cancelled";
    for (const item of order.items) {
      item.status = "cancelled";
      if (item.iccid) {
        const esim = this.esims.get(item.iccid);
        if (esim) esim.profileStatus = "deleted";
      }
    }

    return this.toOrderResult(order);
  }

  // ══════════════════════════════════════════════════════════
  // eSIM Lifecycle (GSMA state machine)
  // ══════════════════════════════════════════════════════════

  protected async _getEsimProfile(iccid: string): Promise<ProviderEsimProfile> {
    const esim = this.esims.get(iccid);
    if (!esim) throw new ProviderEsimNotFoundError(this.name, iccid);
    return this.toEsimProfile(esim);
  }

  protected async _activateEsim(iccid: string): Promise<ProviderEsimActivation> {
    const esim = this.esims.get(iccid);
    if (!esim) throw new ProviderEsimNotFoundError(this.name, iccid);

    // GSMA transition: released → downloaded
    if (esim.profileStatus !== "released") {
      throw new ProviderValidationError(
        this.name,
        `eSIM ${iccid} aktivasyona uygun değil (durum: ${esim.profileStatus}). Sadece "released" durumundaki profiller aktive edilebilir.`,
      );
    }

    esim.profileStatus = "downloaded";
    esim.updatedAt = new Date().toISOString();

    this.logger.info({ iccid }, "eSIM profile released → downloaded");

    return {
      iccid: esim.iccid,
      activationCode: esim.activationCode,
      qrCodeUrl: esim.qrCodeUrl,
      smdpAddress: esim.smdpAddress,
      matchingId: esim.matchingId,
    };
  }

  /** Simulate device binding: downloaded → installed. */
  async simulateDeviceBind(iccid: string): Promise<ProviderEsimProfile> {
    const esim = this.esims.get(iccid);
    if (!esim) throw new ProviderEsimNotFoundError(this.name, iccid);

    if (esim.profileStatus !== "downloaded") {
      throw new ProviderValidationError(this.name, "Sadece downloaded durumundaki eSIM cihaza bağlanabilir");
    }

    esim.profileStatus = "installed";
    if (!esim.msisdn) {
      esim.msisdn = generateFakeMsisdn("90");
    }
    esim.updatedAt = new Date().toISOString();

    this.logger.info({ iccid }, "eSIM downloaded → installed (device bound)");

    if (this.onWebhook) {
      await this.fireWebhook("esim.installed", this.toEsimProfile(esim));
    }

    return this.toEsimProfile(esim);
  }

  /** Transition installed → enabled. */
  async simulateEnable(iccid: string): Promise<ProviderEsimProfile> {
    const esim = this.esims.get(iccid);
    if (!esim) throw new ProviderEsimNotFoundError(this.name, iccid);
    if (esim.profileStatus !== "installed" && esim.profileStatus !== "disabled") {
      throw new ProviderValidationError(this.name, "Bu eSIM enable edilemez");
    }
    esim.profileStatus = "enabled";
    esim.updatedAt = new Date().toISOString();

    if (this.onWebhook) {
      await this.fireWebhook("esim.enabled", this.toEsimProfile(esim));
    }

    return this.toEsimProfile(esim);
  }

  protected async _disableEsim(iccid: string): Promise<ProviderEsimProfile> {
    const esim = this.esims.get(iccid);
    if (!esim) throw new ProviderEsimNotFoundError(this.name, iccid);
    if (esim.profileStatus !== "enabled") {
      throw new ProviderValidationError(this.name, `eSIM ${iccid} şu anda enabled değil (${esim.profileStatus})`);
    }
    esim.profileStatus = "disabled";
    esim.updatedAt = new Date().toISOString();

    if (this.onWebhook) {
      await this.fireWebhook("esim.disabled", this.toEsimProfile(esim));
    }

    return this.toEsimProfile(esim);
  }

  protected async _enableEsim(iccid: string): Promise<ProviderEsimProfile> {
    const esim = this.esims.get(iccid);
    if (!esim) throw new ProviderEsimNotFoundError(this.name, iccid);
    if (esim.profileStatus !== "disabled") {
      throw new ProviderValidationError(this.name, `eSIM ${iccid} şu anda disabled değil (${esim.profileStatus})`);
    }
    esim.profileStatus = "enabled";
    esim.updatedAt = new Date().toISOString();

    if (this.onWebhook) {
      await this.fireWebhook("esim.enabled", this.toEsimProfile(esim));
    }

    return this.toEsimProfile(esim);
  }

  protected async _deleteEsim(iccid: string): Promise<ProviderEsimProfile> {
    const esim = this.esims.get(iccid);
    if (!esim) throw new ProviderEsimNotFoundError(this.name, iccid);
    esim.profileStatus = "deleted";
    esim.updatedAt = new Date().toISOString();

    if (this.onWebhook) {
      await this.fireWebhook("esim.deleted", this.toEsimProfile(esim));
    }

    return this.toEsimProfile(esim);
  }

  // ══════════════════════════════════════════════════════════
  // Usage / CDR
  // ══════════════════════════════════════════════════════════

  protected async _getUsageRecords(
    iccid: string,
    from: string,
    to: string,
  ): Promise<ProviderUsageRecord[]> {
    const esim = this.esims.get(iccid);
    if (!esim) throw new ProviderEsimNotFoundError(this.name, iccid);

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const hours = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / 3_600_000));
    const hourMs = 3_600_000;

    const records: ProviderUsageRecord[] = [];
    for (let i = 0; i < Math.min(hours, 168); i++) { // Max 1 week
      const net = CDR_MCC_MNC_POOL[Math.floor(Math.random() * CDR_MCC_MNC_POOL.length)]!;
      const sessionStart = new Date(fromDate.getTime() + i * hourMs);
      const sessionEnd = new Date(sessionStart.getTime() + hourMs);
      const recordType: UsageRecordType = Math.random() > 0.85 ? "voice" : Math.random() > 0.95 ? "sms" : "data";

      records.push({
        usageId: `CDR-${iccid.slice(-8)}-${sessionStart.getTime()}`,
        iccid,
        sessionStart: sessionStart.toISOString(),
        sessionEnd: sessionEnd.toISOString(),
        dataUsedMB: recordType === "data" ? this.randomBetween(1, 150) : 0,
        networkMccMnc: net.mccMnc,
        country: net.country,
        recordType,
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

    // Simulate incremental usage on each query
    esim.dataUsedMB = Math.min(esim.dataTotalMB, esim.dataUsedMB + this.randomBetween(5, 100));
    esim.voiceUsedMinutes = Math.min(esim.voiceTotalMinutes, esim.voiceUsedMinutes + this.randomBetween(0, 5));
    esim.smsUsed = Math.min(esim.smsTotal, esim.smsUsed + this.randomBetween(0, 3));

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

  // ══════════════════════════════════════════════════════════
  // Billing / Invoice (stub)
  // ══════════════════════════════════════════════════════════

  protected async _getBillingRecords(
    accountId: string,
    periodStart?: string,
    periodEnd?: string,
  ): Promise<ProviderBillingRecord[]> {
    const subscriber = this.subscribers.get(accountId);
    if (!subscriber) {
      throw new ProviderValidationError(this.name, `Subscriber bulunamadı: ${accountId}`);
    }

    // Generate one invoice per month between periodStart and periodEnd
    const start = periodStart ? new Date(periodStart) : new Date(Date.now() - 90 * 86400000);
    const end = periodEnd ? new Date(periodEnd) : new Date();
    const months = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (30 * 86400000)));

    const records: ProviderBillingRecord[] = [];
    for (let i = 0; i < Math.min(months, 6); i++) {
      const monthStart = new Date(start.getTime() + i * 30 * 86400000);
      const monthEnd = new Date(monthStart.getTime() + 30 * 86400000);
      const amount = this.randomBetween(5, 50) + (Math.round(Math.random() * 100) / 100);

      records.push({
        invoiceId: `INV-${accountId}-${monthStart.toISOString().slice(0, 7)}`,
        accountId,
        periodStart: monthStart.toISOString(),
        periodEnd: monthEnd.toISOString(),
        amount,
        currency: "USD",
        status: i < months - 1 ? "paid" : "open",
        lineItems: [
          {
            planId: "fake-tr-3gb-15d",
            quantity: 1,
            unitPrice: 9.99,
            description: "Türkiye 3GB 15 Gün",
          },
        ],
      });
    }
    return records;
  }

  // ══════════════════════════════════════════════════════════
  // Webhooks
  // ══════════════════════════════════════════════════════════

  protected async _handleWebhook(payload: ProviderWebhookPayload): Promise<void> {
    // Fake provider accepts internal webhooks only (via fireWebhook)
    throw new ProviderWebhookError(
      this.name,
      payload.eventType,
      "Fake provider dış webhook kabul etmez — webhook'lar dahili olarak tetiklenir",
    );
  }

  /**
   * Build a signed webhook envelope (HMAC‑SHA256).
   * This simulates what Telna would send to our webhook endpoint.
   */
  buildWebhookEnvelope(eventType: string, payloadData: Record<string, unknown>): ProviderWebhookEnvelope {
    const eventId = this.generateUUID();
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify(payloadData);
    const toSign = `${eventId}.${timestamp}.${payload}`;
    const signature = this.hmacSha256(this.webhookSecret, toSign);

    return {
      eventId,
      eventType,
      timestamp,
      payload: payloadData,
      signature,
    };
  }

  /**
   * Verify a webhook envelope signature.
   */
  verifyWebhookSignature(envelope: ProviderWebhookEnvelope): boolean {
    const payload = JSON.stringify(envelope.payload);
    const toSign = `${envelope.eventId}.${envelope.timestamp}.${payload}`;
    const expected = this.hmacSha256(this.webhookSecret, toSign);
    return expected === envelope.signature;
  }

  // ══════════════════════════════════════════════════════════
  // Private helpers
  // ══════════════════════════════════════════════════════════

  /** Completes order provisioning: provisioning → completed. */
  private async completeOrderProvisioning(orderId: string): Promise<void> {
    const order = this.orders.get(orderId);
    if (!order || order.status !== "provisioning") return;

    order.status = "completed";
    order.activatedAt = new Date().toISOString();

    for (const item of order.items) {
      item.status = "completed";
      // Transition eSIM: released → downloaded → installed → enabled
      if (item.iccid) {
        const esim = this.esims.get(item.iccid);
        if (esim && esim.profileStatus === "released") {
          esim.profileStatus = "enabled";
          esim.msisdn = generateFakeMsisdn("90");
          esim.updatedAt = new Date().toISOString();
        }
      }
    }

    this.logger.info({ orderId }, "Order provisioning completed (async) — eSIMs enabled");

    if (this.onWebhook) {
      try {
        await this.fireWebhook("order.completed", {
          orderId: order.orderId,
          subscriberId: order.subscriberId,
          planId: order.planId,
          status: "completed",
          items: order.items.map((it) => ({
            itemId: it.itemId,
            iccid: it.iccid,
            status: it.status,
          })),
        });
      } catch (err) {
        this.logger.error({ err, orderId }, "Webhook callback failed");
      }
    }
  }

  private async fireWebhook(
    eventType: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (!this.onWebhook) return;
    const envelope = this.buildWebhookEnvelope(eventType, data);
    try {
      await this.onWebhook(eventType, { envelope, ...data });
    } catch {
      // fire‑and‑forget, caller should handle
    }
  }

  private toOrderResult(order: FakeOrder): ProviderOrderResult {
    return {
      orderId: order.orderId,
      subscriberId: order.subscriberId,
      planId: order.planId,
      status: order.status,
      quantity: order.quantity,
      items: order.items.map((it) => ({
        itemId: it.itemId,
        iccid: it.iccid,
        eid: it.eid,
        status: it.status,
        qrCodeUrl: it.qrCodeUrl,
        activationCode: it.activationCode,
        smdpAddress: it.smdpAddress,
        matchingId: it.matchingId,
      })),
      createdAt: order.createdAt,
      activatedAt: order.activatedAt,
    };
  }

  private toEsimProfile(esim: FakeEsim): ProviderEsimProfile {
    return {
      iccid: esim.iccid,
      eid: esim.eid,
      imsi: esim.imsi,
      msisdn: esim.msisdn,
      activationCode: esim.activationCode,
      qrCodeUrl: esim.qrCodeUrl,
      smdpAddress: esim.smdpAddress,
      matchingId: esim.matchingId,
      profileStatus: esim.profileStatus,
      apn: esim.apn,
      planId: esim.planId,
      orderId: esim.orderId,
      subscriberId: esim.subscriberId,
      createdAt: esim.createdAt,
      updatedAt: esim.updatedAt,
    };
  }

  private generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private hmacSha256(_secret: string, _message: string): string {
    // In a real implementation use crypto.subtle or Node crypto.
    // For the fake provider we use a deterministic placeholder since
    // the webhook verification happens inside the same process.
    // Real providers will use actual HMAC via Node/Edge crypto.
    const hash = Buffer.from(_secret + _message).toString("hex").slice(0, 64);
    return `sha256=${hash}`;
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}








