# API Design — Telecom Distribution Platform

## 1. Base URL

```
Development: http://localhost:3000/api/v1
Production:  https://{domain}/api/v1
```

## 2. Authentication

All API requests (except auth endpoints) require a Bearer token:

```
Authorization: Bearer {session_token}
```

Session management via Auth.js (NextAuth.js v5). Cookies used for server-rendered pages, Bearer header for API clients.

---

## 3. Standard Response Envelope

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 100
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "ORDER_NOT_FOUND",
    "message": "Order with ID xyz not found",
    "details": { ... } // Optional validation errors
  }
}
```

---

## 4. API Endpoints

### 4.1 Auth Module

| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/logout` | Invalidate session |
| POST | `/auth/register` | Self-registration (customer) |
| GET | `/auth/session` | Get current session |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |

### 4.2 Tenant Module

| Method | Path | Description |
|---|---|---|
| GET | `/tenants` | List sub-tenants (hierarchical) |
| POST | `/tenants` | Create sub-tenant (Dealer/Sub Dealer) |
| GET | `/tenants/:id` | Get tenant details |
| PATCH | `/tenants/:id` | Update tenant settings |
| GET | `/tenants/:id/users` | List users under a tenant |
| GET | `/tenants/tree` | Get full tenant hierarchy tree |

### 4.3 User Module

| Method | Path | Description |
|---|---|---|
| GET | `/users` | List users (scoped to tenant) |
| POST | `/users` | Create user (Employee/Customer) |
| GET | `/users/:id` | Get user details |
| PATCH | `/users/:id` | Update user |
| DELETE | `/users/:id` | Soft-delete user |
| GET | `/users/:id/orders` | Get user's orders |

### 4.4 Product Module

| Method | Path | Description |
|---|---|---|
| GET | `/products` | List products (scoped to tenant) |
| POST | `/products` | Create product |
| GET | `/products/:id` | Get product details |
| PATCH | `/products/:id` | Update product |
| DELETE | `/products/:id` | Soft-delete product |
| GET | `/products/sync` | Sync products from Telna (Distributor only) |
| GET | `/countries` | List supported countries |
| GET | `/countries/:id/regions` | List regions for a country |

### 4.5 Order Module

| Method | Path | Description |
|---|---|---|
| GET | `/orders` | List orders (scoped to tenant) |
| POST | `/orders` | Create order (DRAFT) |
| GET | `/orders/:id` | Get order details with items |
| PATCH | `/orders/:id` | Update order (DRAFT only) |
| POST | `/orders/:id/submit` | Submit order (DRAFT → PENDING) |
| POST | `/orders/:id/pay` | Mark as paid (PENDING → PAID) |
| POST | `/orders/:id/cancel` | Cancel order |
| POST | `/orders/:id/items/:itemId/activate` | Activate eSIM for item |
| GET | `/orders/:id/items/:itemId/qrcode` | Get QR code for eSIM |

### 4.6 eSIM Module

| Method | Path | Description |
|---|---|---|
| GET | `/esims` | List eSIM profiles |
| GET | `/esims/:id` | Get eSIM details |
| GET | `/esims/:id/usage` | Get usage data |
| POST | `/esims/:id/suspend` | Suspend eSIM |
| POST | `/esims/:id/terminate` | Terminate eSIM |

### 4.7 Webhook Module

| Method | Path | Description |
|---|---|---|
| POST | `/webhooks/telna` | Receive webhook from Telna |
| GET | `/webhooks/events` | List webhook events |
| POST | `/webhooks/events/:id/retry` | Retry failed webhook processing |

### 4.8 Reporting Module

| Method | Path | Description |
|---|---|---|
| GET | `/reports/sales` | Sales report (date range, tenant) |
| GET | `/reports/usage` | Usage report |
| GET | `/reports/commission` | Commission/rebate report |
| GET | `/reports/dashboard` | Dashboard summary stats |

---

## 5. API Route Structure (Next.js App Router)

```
src/
  app/
    api/
      v1/
        auth/
          login/route.ts
          logout/route.ts
          register/route.ts
          session/route.ts
          forgot-password/route.ts
          reset-password/route.ts
        tenants/
          route.ts                    # GET, POST
          [id]/route.ts              # GET, PATCH
          [id]/users/route.ts        # GET
          tree/route.ts              # GET
        users/
          route.ts                    # GET, POST
          [id]/route.ts              # GET, PATCH, DELETE
          [id]/orders/route.ts       # GET
        products/
          route.ts                    # GET, POST
          [id]/route.ts              # GET, PATCH, DELETE
          sync/route.ts              # GET
        countries/
          route.ts                    # GET
          [id]/regions/route.ts      # GET
        orders/
          route.ts                    # GET, POST
          [id]/route.ts              # GET, PATCH
          [id]/submit/route.ts       # POST
          [id]/pay/route.ts          # POST
          [id]/cancel/route.ts       # POST
          [id]/items/
            [itemId]/activate/route.ts  # POST
            [itemId]/qrcode/route.ts    # GET
        esims/
          route.ts                    # GET
          [id]/route.ts              # GET
          [id]/usage/route.ts        # GET
          [id]/suspend/route.ts      # POST
          [id]/terminate/route.ts    # POST
        webhooks/
          telna/route.ts             # POST
          events/route.ts            # GET
          events/[id]/retry/route.ts # POST
        reports/
          sales/route.ts             # GET
          usage/route.ts             # GET
          commission/route.ts        # GET
          dashboard/route.ts         # GET
```

---

## 6. Middleware Chain

```
Request
  → AuthMiddleware (session validation)
    → TenantMiddleware (resolve tenant context)
      → RBACMiddleware (role/permission check)
        → ValidationMiddleware (Zod schema)
          → Route Handler
            → Response
```

---

## 7. Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `ORDER_STATUS_CONFLICT` | 409 | Invalid status transition |
| `INSUFFICIENT_STOCK` | 409 | Product out of stock |
| `PROVIDER_ERROR` | 502 | Telna API error |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
