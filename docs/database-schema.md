# Database Schema — ER Diagram

## 1. Naming Conventions

- **Tables**: `snake_case`, pluralized (e.g., `users`, `order_items`)
- **Columns**: `snake_case`
- **Primary Keys**: `id` (UUID v4)
- **Foreign Keys**: `{reference_table}_id` (e.g., `tenant_id`, `distributor_id`)
- **Timestamps**: `created_at`, `updated_at`, `deleted_at` (soft delete)
- All tables include `tenant_id` and `distributor_id` for multi-tenant isolation.

---

## 2. Entity Relationship Diagram

```mermaid
erDiagram
    tenants {
        uuid id PK
        string name
        string type "DISTRIBUTOR | DEALER | SUB_DEALER"
        uuid parent_id FK "Self-referencing hierarchy"
        uuid distributor_id FK "Root distributor"
        boolean is_active
        jsonb settings
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    users {
        uuid id PK
        uuid tenant_id FK
        uuid distributor_id FK
        string email UK
        string password_hash
        string first_name
        string last_name
        string role "SUPER_ADMIN | DISTRIBUTOR | DEALER | SUB_DEALER | EMPLOYEE | CUSTOMER"
        uuid managed_by_id FK "References users.id for employee->manager"
        boolean is_active
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    countries {
        uuid id PK
        string iso_code UK
        string name
        string dial_code
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    regions {
        uuid id PK
        uuid country_id FK
        string name
        string code
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    products {
        uuid id PK
        uuid tenant_id FK
        uuid distributor_id FK
        string name
        string description
        string type "ESIM | DATA_BUNDLE | VOICE_BUNDLE | TOPUP"
        uuid country_id FK
        uuid region_id FK "Nullable"
        decimal cost_price
        decimal selling_price
        string currency "USD | EUR | TRY"
        string telna_product_id "Maps to Telna API product"
        jsonb specifications "Volume, duration, speed caps, etc."
        boolean is_active
        integer stock_count
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    orders {
        uuid id PK
        uuid tenant_id FK
        uuid distributor_id FK
        uuid customer_id FK "References users.id"
        uuid created_by_id FK "References users.id"
        string order_number UK "Human-readable: ORD-20260722-XXXX"
        string status "DRAFT | PENDING | PAID | PROCESSING | COMPLETED | CANCELLED | REFUNDED"
        decimal total_amount
        string currency
        jsonb payment_info "Payment method, transaction ID, etc."
        string notes
        timestamp paid_at
        timestamp completed_at
        timestamp cancelled_at
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }

    order_items {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        uuid tenant_id FK
        uuid distributor_id FK
        integer quantity
        decimal unit_price
        decimal total_price
        string status "PENDING | ACTIVATED | CANCELLED | EXPIRED"
        string iccid "eSIM identifier after activation"
        string telna_order_id "Telna API reference"
        jsonb activation_details "QR code, confirmation data"
        timestamp created_at
        timestamp updated_at
    }

    esim_profiles {
        uuid id PK
        uuid order_item_id FK
        uuid tenant_id FK
        uuid distributor_id FK
        uuid customer_id FK
        string iccid UK
        string status "AVAILABLE | ASSIGNED | ACTIVATED | SUSPENDED | TERMINATED"
        string qr_code_url
        string activation_code
        string smdp_address
        string telna_esim_id
        timestamp activated_at
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    usage_records {
        uuid id PK
        uuid esim_profile_id FK
        uuid tenant_id FK
        uuid distributor_id FK
        string type "DATA | VOICE | SMS"
        decimal used_amount
        decimal total_amount
        string unit "MB | GB | MIN | SMS"
        string period_start
        string period_end
        timestamp created_at
    }

    webhook_events {
        uuid id PK
        uuid tenant_id FK
        uuid distributor_id FK
        string event_type "ORDER_STATUS | ESIM_STATUS | USAGE_ALERT | TOPUP"
        jsonb payload
        string status "RECEIVED | PROCESSED | FAILED"
        string error_message
        timestamp processed_at
        timestamp created_at
    }

    audit_logs {
        uuid id PK
        uuid tenant_id FK
        uuid distributor_id FK
        uuid user_id FK
        string action "CREATE | UPDATE | DELETE | LOGIN | STATUS_CHANGE"
        string entity_type
        uuid entity_id
        jsonb old_values
        jsonb new_values
        string ip_address
        timestamp created_at
    }

    %% Relationships
    tenants ||--o{ tenants : "parent_id"
    tenants ||--o{ users : "tenant_id"
    tenants ||--o{ products : "tenant_id"
    tenants ||--o{ orders : "tenant_id"
    users ||--o{ orders : "customer_id"
    users ||--o{ orders : "created_by_id"
    users ||--o{ users : "managed_by_id"
    countries ||--o{ products : "country_id"
    regions ||--o{ products : "region_id"
    orders ||--o{ order_items : "order_id"
    products ||--o{ order_items : "product_id"
    order_items ||--o{ esim_profiles : "order_item_id"
    esim_profiles ||--o{ usage_records : "esim_profile_id"
```

---

## 3. Key Table Details

### 3.1 `tenants`
Hierarchical tenant structure. `type` determines the tier. `parent_id` creates the tree:
- `DISTRIBUTOR` → `parent_id` is NULL
- `DEALER` → `parent_id` references a DISTRIBUTOR
- `SUB_DEALER` → `parent_id` references a DEALER

`distributor_id` is always the root DISTRIBUTOR for the branch, propagated down.

### 3.2 `users`
Unified user table with `role` discriminator. `managed_by_id` links an Employee to their manager (a Dealer or Sub Dealer user). Customers are linked to the tenant that owns them.

### 3.3 `products`
Products are tenant-scoped. A Distributor defines products and their pricing. Dealers/Sub Dealers may have visibility limited to specific product sets. `telna_product_id` maps to the external provider's catalog.

### 3.4 `orders`
Order lifecycle tracked via `status` field. Each order belongs to a tenant and is created by a user on behalf of a customer.

### 3.5 `esim_profiles`
Tracks the lifecycle of each eSIM from availability through activation to termination. QR code and activation data stored for customer delivery.

### 3.6 `audit_logs`
Immutable log for compliance and debugging. Captures all state-changing operations.

---

## 4. Index Strategy

```sql
-- Core lookup indexes
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_esim_iccid ON esim_profiles(iccid);
CREATE INDEX idx_esim_status ON esim_profiles(status);
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_telna ON products(telna_product_id);
CREATE INDEX idx_usage_esim ON usage_records(esim_profile_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_webhook_status ON webhook_events(status);
```

---

## 5. Multi-Tenant Query Pattern

Every repository query MUST include tenant filtering:

```typescript
// Example Prisma query with tenant isolation
const orders = await prisma.order.findMany({
  where: {
    tenant_id: user.tenant_id,
    // distributor_id: user.distributor_id, // for cross-tenant admin views
  },
  include: { order_items: true },
});
```
