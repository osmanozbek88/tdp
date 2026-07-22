# Provider Interface Contract

## 1. Purpose

The Provider Interface abstracts the external telecom API (Telna) behind a stable contract. This allows:
- Development and testing against a **FakeProvider** without network dependencies
- Switching to **TelnaProvider** in production via configuration
- Easy migration to alternative providers in the future

---

## 2. Interface Definition

```typescript
// ============================================================
// src/lib/provider/types.ts
// ============================================================

export interface IProvider {
  /** Authentication & Health */
  authenticate(): Promise<AuthResult>;
  healthCheck(): Promise<HealthStatus>;

  /** Product Catalog */
  getProducts(filter?: ProductFilter): Promise<Product[]>;
  getCountries(): Promise<Country[]>;
  getRegions(countryId: string): Promise<Region[]>;

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
```

---

## 3. Type Definitions

```typescript
// ============================================================
// src/lib/provider/types.ts (continued)
// ============================================================

// --- Auth ---
export interface AuthResult {
  accessToken: string;
  expiresAt: Date;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  timestamp: Date;
}

// --- Product ---
export interface ProductFilter {
  countryId?: string;
  type?: ProductType;
  search?: string;
}

export type ProductType = 'ESIM' | 'DATA_BUNDLE' | 'VOICE_BUNDLE' | 'TOPUP';

export interface Product {
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

export interface ProductSpecifications {
  volume?: number;       // Data volume in MB/GB
  volumeUnit?: 'MB' | 'GB';
  duration?: number;     // Validity period
  durationUnit?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
  speedCap?: string;     // e.g., "5Mbps"
  isRoaming?: boolean;
  supportedCountries?: string[];
}

export interface Country {
  isoCode: string;       // ISO 3166-1 alpha-2
  name: string;
  dialCode: string;
  regions?: Region[];
}

export interface Region {
  code: string;
  name: string;
}

// --- Order ---
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

export interface OrderResult {
  telnaOrderId: string;
  status: OrderProviderStatus;
  items: OrderItemResult[];
  createdAt: Date;
}

export interface OrderItemResult {
  telnaItemId: string;
  telnaProductId: string;
  iccid?: string;
  status: OrderProviderStatus;
}

export type OrderProviderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

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

// --- eSIM ---
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

export type EsimProviderStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'ACTIVATED'
  | 'SUSPENDED'
  | 'TERMINATED'
  | 'EXPIRED';

export interface EsimDetails {
  iccid: string;
  status: EsimProviderStatus;
  imsi?: string;
  msisdn?: string;
  activatedAt?: Date;
  expiresAt?: Date;
  currentPlan?: string;
  remainingData?: number;
  remainingDataUnit?: 'MB' | 'GB';
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

// --- Usage ---
export interface UsagePeriod {
  startDate: Date;
  endDate: Date;
}

export interface UsageRecord {
  iccid: string;
  type: 'DATA' | 'VOICE' | 'SMS';
  usedAmount: number;
  totalAmount: number;
  unit: 'MB' | 'GB' | 'MIN' | 'SMS';
  periodStart: Date;
  periodEnd: Date;
  details?: UsageDetail[];
}

export interface UsageDetail {
  timestamp: Date;
  amount: number;
  type: 'DATA' | 'VOICE' | 'SMS';
  direction?: 'IN' | 'OUT';
  destination?: string;
}

// --- Webhook ---
export interface WebhookPayload {
  eventType: WebhookEventType;
  telnaOrderId?: string;
  iccid?: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

export type WebhookEventType =
  | 'ORDER_STATUS_CHANGED'
  | 'ESIM_ACTIVATED'
  | 'ESIM_SUSPENDED'
  | 'ESIM_TERMINATED'
  | 'USAGE_THRESHOLD'
  | 'TOPUP_COMPLETED';

export interface WebhookResult {
  success: boolean;
  eventId: string;
}
```

---

## 4. Provider Implementations

### 4.1 FakeProvider

```typescript
// src/lib/provider/fake-provider.ts
//
// Used for:
// - Local development without Telna API access
// - Integration tests
// - UI demos and preview environments
//
// Behavior:
// - Returns realistic mock data
// - Simulates network latency (configurable)
// - Maintains in-memory state for orders and eSIMs
// - Can be seeded with test scenarios
```

### 4.2 TelnaProvider

```typescript
// src/lib/provider/telna-provider.ts
//
// Used for:
// - Production environment
// - Staging environment with real API
//
// Behavior:
// - Authenticates via OAuth2 client credentials
// - Maps TDP types to Telna API request/response shapes
// - Implements retry with exponential backoff
// - Logs all API calls for audit
// - Rate-limited per tenant
```

---

## 5. Provider Factory

```typescript
// src/lib/provider/provider-factory.ts

export type ProviderType = 'fake' | 'telna';

export function createProvider(type?: ProviderType): IProvider {
  const provider = type ?? process.env.PROVIDER_TYPE ?? 'fake';

  switch (provider) {
    case 'telna':
      return new TelnaProvider({
        apiKey: process.env.TELNA_API_KEY!,
        apiUrl: process.env.TELNA_API_URL!,
        timeout: 30000,
      });
    case 'fake':
    default:
      return new FakeProvider({
        latencyMs: 100,        // Simulated network delay
        failRate: 0,           // 0.0 to 1.0 — simulated failure rate
      });
  }
}
```

---

## 6. Telna API Integration Points

| TDP Method | Telna API Endpoint | Method |
|---|---|---|
| `authenticate()` | `/oauth/token` | POST |
| `healthCheck()` | `/health` | GET |
| `getProducts()` | `/products` | GET |
| `getCountries()` | `/countries` | GET |
| `getRegions()` | `/countries/{id}/regions` | GET |
| `createOrder()` | `/orders` | POST |
| `getOrderStatus()` | `/orders/{orderId}` | GET |
| `cancelOrder()` | `/orders/{orderId}/cancel` | POST |
| `activateEsim()` | `/esims/{iccid}/activate` | POST |
| `getEsimDetails()` | `/esims/{iccid}` | GET |
| `getQrCode()` | `/esims/{iccid}/qrcode` | GET |
| `suspendEsim()` | `/esims/{iccid}/suspend` | POST |
| `terminateEsim()` | `/esims/{iccid}/terminate` | POST |
| `getUsage()` | `/esims/{iccid}/usage` | GET |
| `handleWebhook()` | (incoming) `POST /webhooks/telna` | POST |

---

## 7. Error Handling

```typescript
export class ProviderError extends Error {
  constructor(
    public readonly code: ProviderErrorCode,
    message: string,
    public readonly statusCode?: number,
    public readonly rawResponse?: unknown,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export type ProviderErrorCode =
  | 'AUTH_FAILED'
  | 'INVALID_REQUEST'
  | 'PRODUCT_NOT_FOUND'
  | 'ORDER_FAILED'
  | 'ESIM_NOT_FOUND'
  | 'ACTIVATION_FAILED'
  | 'INSUFFICIENT_CREDIT'
  | 'RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNKNOWN';
```
