# Development Roadmap — Telecom Distribution Platform

## Phase Overview

```
FAZ 0 (Current) → FAZ 1 → FAZ 2 → FAZ 3 → FAZ 4 → FAZ 5
Analysis         Core    Order   Prod.   eSIM    Reporting
& Design         Setup   Engine  Catalog Lifecycle & Polish
```

---

## FAZ 0 — Analysis & System Design (Current)

**Goal**: Complete system architecture and documentation.

| # | Task | Status |
|---|---|---|
| 0.1 | Architecture document | ✅ Done |
| 0.2 | Database schema & ER diagram | ✅ Done |
| 0.3 | API design document | ✅ Done |
| 0.4 | Provider interface contract | ✅ Done |
| 0.5 | Wireframe inventory | ✅ Done |
| 0.6 | Roadmap & phase planning | ✅ Done |

**Deliverable**: `/docs/` folder with 6 documents.

---

## FAZ 1 — Core Project Setup

**Goal**: Scaffold the project, establish foundations, implement auth and tenant hierarchy.

### Tasks

| # | Task | Est. | Dependencies |
|---|---|---|---|
| 1.1 | Initialize Next.js 14+ with TypeScript strict, Tailwind, shadcn/ui | 2h | — |
| 1.2 | Configure Prisma with PostgreSQL, create initial schema migration | 2h | 1.1 |
| 1.3 | Set up project folder structure (modules, layers) | 1h | 1.1 |
| 1.4 | Implement Core module: shared types, enums, constants, base classes | 2h | 1.2 |
| 1.5 | Implement Auth module: Auth.js integration, login/logout/session | 4h | 1.4 |
| 1.6 | Implement RBAC middleware and permission guards | 3h | 1.5 |
| 1.7 | Implement Tenant module: CRUD, hierarchy tree, tenant context middleware | 4h | 1.5 |
| 1.8 | Implement User module: CRUD, employee management | 3h | 1.7 |
| 1.9 | Set up FakeProvider with mock data | 3h | 1.4 |
| 1.10 | Create Provider Factory and dependency injection | 1h | 1.9 |
| 1.11 | Build Login page UI | 2h | 1.5 |
| 1.12 | Build Dashboard page with role-based content | 3h | 1.6, 1.7 |
| 1.13 | Build User management pages (list, create, edit) | 3h | 1.8 |
| 1.14 | Build Tenant hierarchy page | 2h | 1.7 |
| 1.15 | Integration tests for auth flow | 2h | 1.5 |
| 1.16 | Integration tests for tenant hierarchy | 2h | 1.7 |

**Total Est.**: 37h  
**Exit Criteria**: User can log in, see role-based dashboard, manage users and tenants.

---

## FAZ 2 — Order Engine

**Goal**: Implement product catalog and order lifecycle.

### Tasks

| # | Task | Est. | Dependencies |
|---|---|---|---|
| 2.1 | Implement Product module: CRUD, country/region mapping | 4h | 1.4 |
| 2.2 | Implement product sync from Telna (via FakeProvider) | 2h | 2.1, 1.9 |
| 2.3 | Implement Order module: CRUD, status machine | 6h | 1.4 |
| 2.4 | Implement order submission workflow (DRAFT → PENDING → PAID) | 3h | 2.3 |
| 2.5 | Implement order cancellation logic | 2h | 2.3 |
| 2.6 | Build Product list and create/edit pages | 3h | 2.1 |
| 2.7 | Build Order list page with filters | 3h | 2.3 |
| 2.8 | Build Create Order multi-step form | 4h | 2.3, 2.1 |
| 2.9 | Build Order Detail page with timeline | 3h | 2.3 |
| 2.10 | Integration tests for order lifecycle | 3h | 2.3 |

**Total Est.**: 33h  
**Exit Criteria**: User can browse products, create orders, submit and pay.

---

## FAZ 3 — Product Catalog & Provider Integration

**Goal**: Connect to Telna API, sync real products, handle provider errors.

### Tasks

| # | Task | Est. | Dependencies |
|---|---|---|---|
| 3.1 | Implement TelnaProvider: authentication | 3h | 1.9, 1.10 |
| 3.2 | Implement TelnaProvider: product catalog sync | 3h | 3.1 |
| 3.3 | Implement TelnaProvider: order creation & status | 4h | 3.1 |
| 3.4 | Implement TelnaProvider: error handling & retry logic | 3h | 3.1 |
| 3.5 | Add provider switching UI (dev toggle) | 1h | 1.10 |
| 3.6 | Build product sync UI with status feedback | 2h | 3.2 |
| 3.7 | Provider health check & monitoring | 2h | 3.1 |
| 3.8 | Integration tests with TelnaProvider (sandbox) | 4h | 3.3 |

**Total Est.**: 22h  
**Exit Criteria**: System syncs products from Telna, creates real orders via API.

---

## FAZ 4 — eSIM Lifecycle & Webhooks

**Goal**: Full eSIM lifecycle management and webhook integration.

### Tasks

| # | Task | Est. | Dependencies |
|---|---|---|---|
| 4.1 | Implement eSIM profile module (CRUD, status tracking) | 4h | 1.4 |
| 4.2 | Implement eSIM activation flow (order → activate) | 3h | 4.1, 2.3 |
| 4.3 | Implement QR code generation and retrieval | 2h | 4.1 |
| 4.4 | Implement eSIM suspend/terminate | 2h | 4.1 |
| 4.5 | Implement usage data retrieval | 2h | 4.1 |
| 4.6 | Implement webhook receiver endpoint | 3h | 1.4 |
| 4.7 | Implement webhook event processing (order status, eSIM status) | 4h | 4.6 |
| 4.8 | Implement webhook retry mechanism | 2h | 4.7 |
| 4.9 | Build eSIM detail page with QR code display | 3h | 4.1 |
| 4.10 | Build eSIM list page with status filters | 2h | 4.1 |
| 4.11 | Build webhook event log page | 2h | 4.7 |
| 4.12 | Integration tests for eSIM lifecycle | 3h | 4.2 |
| 4.13 | Integration tests for webhook processing | 3h | 4.7 |

**Total Est.**: 35h  
**Exit Criteria**: eSIMs can be activated, QR codes viewed, usage tracked, webhooks processed.

---

## FAZ 5 — Reporting & Polish

**Goal**: Reporting dashboards, export, performance optimization, and deployment readiness.

### Tasks

| # | Task | Est. | Dependencies |
|---|---|---|---|
| 5.1 | Implement sales report with aggregation | 4h | 2.3 |
| 5.2 | Implement usage report | 3h | 4.5 |
| 5.3 | Implement commission/rebate report | 3h | 5.1 |
| 5.4 | Build dashboard charts and widgets | 4h | 5.1 |
| 5.5 | Add data export (CSV, PDF) | 3h | 5.1 |
| 5.6 | Add audit log viewer page | 2h | 1.4 |
| 5.7 | Performance optimization (N+1 queries, caching) | 3h | — |
| 5.8 | Error boundary and loading states for all pages | 2h | — |
| 5.9 | Docker Compose setup for production-like environment | 2h | — |
| 5.10 | End-to-end tests with Playwright | 6h | — |
| 5.11 | Security audit (RBAC, tenant isolation, input validation) | 3h | — |
| 5.12 | Documentation update & README | 2h | — |

**Total Est.**: 37h  
**Exit Criteria**: Full-featured platform ready for staging deployment.

---

## Summary

| Phase | Hours | Key Deliverable |
|---|---|---|
| FAZ 0 — Analysis & Design | — | 6 architecture documents |
| FAZ 1 — Core Setup | 37h | Auth, tenants, users, project scaffold |
| FAZ 2 — Order Engine | 33h | Products, orders, status machine |
| FAZ 3 — Provider Integration | 22h | Telna API connection, real data sync |
| FAZ 4 — eSIM & Webhooks | 35h | eSIM lifecycle, webhook processing |
| FAZ 5 — Reporting & Polish | 37h | Reports, charts, E2E tests, deploy |
| **Total** | **164h** | |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Telna API breaking changes | Low | High | Versioned provider adapter, integration tests |
| Multi-tenant data leakage | Low | Critical | Mandatory tenant_id filtering, RLS policies |
| Order state machine complexity | Medium | Medium | State diagram, exhaustive unit tests |
| Webhook reliability | Medium | High | Idempotency keys, retry queue, dead-letter logging |
| Performance with large datasets | Low | Medium | Pagination, indexed queries, materialized views for reports |
