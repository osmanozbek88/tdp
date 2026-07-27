# Wireframes — Telecom Distribution Platform

## 1. Screen Inventory

Below is the complete list of screens/pages required for the MVP, organized by user role.

---

## 2. Authentication Screens

### 2.1 Login Page
```
┌─────────────────────────────────────┐
│  [Logo]                             │
│                                     │
│  Welcome Back                       │
│  Sign in to your account            │
│                                     │
│  Email                    [input]   │
│  Password                 [input]   │
│                                     │
│  [Forgot Password?]                 │
│                                     │
│  [Sign In]                          │
│                                     │
│  Don't have an account? [Register]  │
└─────────────────────────────────────┘
```

### 2.2 Forgot Password / Reset Password
```
┌─────────────────────────────────────┐
│  [Logo]                             │
│                                     │
│  Reset Password                     │
│  Enter your email to receive a link │
│                                     │
│  Email                    [input]   │
│                                     │
│  [Send Reset Link]                  │
│                                     │
│  Back to [Sign In]                  │
└─────────────────────────────────────┘
```

---

## 3. Dashboard

### 3.1 Main Dashboard (Role-Based)
```
┌──────────────────────────────────────────────────────────┐
│  [Logo]  [Dashboard] [Orders] [Products] [Users]  [👤]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Welcome, {User}                    {Role} | {Tenant}    │
│                                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                │
│  │ 245  │  │ 1,280│  │ $45K │  │ 12   │                │
│  │Orders│  │E-SIMs│  │Revenue│  │Active│                │
│  │      │  │Active│  │(Month)│  │Users │                │
│  └──────┘  └──────┘  └──────┘  └──────┘                │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Recent Orders                          [View All]│    │
│  │  ┌─────┬──────────┬──────┬────────┬────────┐     │    │
│  │  │ #   │ Customer │Items │ Amount │ Status │     │    │
│  │  ├─────┼──────────┼──────┼────────┼────────┤     │    │
│  │  │ 001 │ John D.  │ 2    │ $89.90 │ ✅     │     │    │
│  │  │ 002 │ Jane S.  │ 1    │ $44.95 │ ⏳     │     │    │
│  │  │ 003 │ Bob M.   │ 3    │ $134.85│ ❌     │     │    │
│  │  └─────┴──────────┴──────┴────────┴────────┘     │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────┐ ┌──────────────────────┐   │
│  │  Sales Chart (7 days)    │ │  Top Products        │   │
│  │  [Bar/Line Chart]        │ │  • Europe eSIM 5GB   │   │
│  │                          │ │  • USA Unlimited     │   │
│  │                          │ │  • Turkey 20GB       │   │
│  └──────────────────────────┘ └──────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Order Management

### 4.1 Order List
```
┌──────────────────────────────────────────────────────────┐
│  [Logo]  [Dashboard] [Orders] [Products] [Users]  [👤]  │
├──────────────────────────────────────────────────────────┤
│  Orders                                    [+ New Order] │
│                                                          │
│  [Search...]        [Status: All ▾] [Date Range ▾]       │
│                                                          │
│  ┌──────┬────────┬──────────┬──────┬────────┬────────┐  │
│  │Order#│Customer│  Items   │Total │ Status │  Date  │  │
│  ├──────┼────────┼──────────┼──────┼────────┼────────┤  │
│  │ORD-01│ John   │ 2 items  │$89.90│ ✅ Paid│ 22 Jul │  │
│  │ORD-02│ Jane   │ 1 item   │$44.95│ ⏳ Proc.│ 22 Jul │  │
│  │ORD-03│ Bob    │ 3 items  │$134.8│ 📝 Draft│ 21 Jul │  │
│  │ORD-04│ Alice  │ 1 item   │$29.99│ ❌ Canc.│ 21 Jul │  │
│  └──────┴────────┴──────────┴──────┴────────┴────────┘  │
│                                                          │
│  [< Prev]  Page 1 of 5  [Next >]                        │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Create Order (Multi-Step)
```
┌──────────────────────────────────────────────────────────┐
│  [Logo]  [Dashboard] [Orders] [Products] [Users]  [👤]  │
├──────────────────────────────────────────────────────────┤
│  New Order                                    Step 1 of 3│
│                                                          │
│  ┌─ Customer Information ──────────────────────────────┐ │
│  │  Customer Email          [input]                     │ │
│  │  Customer Name           [input]                     │ │
│  │  Customer Phone          [input]                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─ Select Products ───────────────────────────────────┐ │
│  │  [Search products...]                                │ │
│  │                                                      │ │
│  │  ┌───┬────────────────────────┬──────┬──────┬────┐  │ │
│  │  │   │ Product                │Price │Qty   │Total│  │ │
│  │  │   ├────────────────────────┼──────┼──────┼────┤  │ │
│  │  │ ☐ │ Europe eSIM 5GB/30d   │$44.95│ [1]  │$44.9│  │ │
│  │  │ ☐ │ USA Unlimited 7d      │$29.99│ [2]  │$59.9│  │ │
│  │  │ ☐ │ Turkey 20GB/30d       │$19.99│ [1]  │$19.9│  │ │
│  │  └───┴────────────────────────┴──────┴──────┴────┘  │ │
│  │                                                      │ │
│  │  Total: $124.88                                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                          │
│  [Back]                              [Review Order]      │
└──────────────────────────────────────────────────────────┘
```

### 4.3 Order Detail
```
┌──────────────────────────────────────────────────────────┐
│  [Logo]  [Dashboard] [Orders] [Products] [Users]  [👤]  │
├──────────────────────────────────────────────────────────┤
│  Order #ORD-20260722-0042                                │
│                                                          │
│  Status: ● Paid          Created: 22 Jul 2026 14:30      │
│                                                          │
│  ┌─ Customer ─────────────────────────────────────────┐  │
│  │  John Doe  •  john@example.com  •  +1 555-0123     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Order Items ───────────────────────────────────────┐ │
│  │  ┌──────────┬────────┬────┬───────┬───────┬──────┐ │ │
│  │  │ Product  │  ICCID │Qty │Price  │Status │Action│ │ │
│  │  ├──────────┼────────┼────┼───────┼───────┼──────┤ │ │
│  │  │ Europe   │ 8944.. │ 1  │$44.95 │Active │[QR] │ │ │
│  │  │ USA Unl. │ 8945.. │ 2  │$29.99 │Active │[QR] │ │ │
│  │  └──────────┴────────┴────┴───────┴───────┴──────┘ │ │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Timeline ──────────────────────────────────────────┐ │
│  │  📝 Draft       22 Jul 14:30                        │ │
│  │  💳 Paid        22 Jul 14:32                        │ │
│  │  ⚙️ Processing  22 Jul 14:35                        │ │
│  │  ✅ Completed   22 Jul 14:38                        │ │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [Cancel Order]              [Download Invoice]          │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Product Management

### 5.1 Product List
```
┌──────────────────────────────────────────────────────────┐
│  [Logo]  [Dashboard] [Orders] [Products] [Users]  [👤]  │
├──────────────────────────────────────────────────────────┤
│  Products                                 [+ Add Product]│
│                                          [↻ Sync Telna] │
│  [Search...]        [Type: All ▾] [Country ▾]           │
│                                                          │
│  ┌────┬────────────┬───────┬────────┬───────┬────────┐  │
│  │    │ Name       │ Type  │Country │Price  │ Stock  │  │
│  │    ├────────────┼───────┼────────┼───────┼────────┤  │
│  │ 🟢 │ Europe 5GB │ ESIM  │ Multi  │$44.95 │   ∞    │  │
│  │ 🟢 │ USA Unltd  │ ESIM  │ US     │$29.99 │  150   │  │
│  │ 🔴 │ Turkey 20GB│ ESIM  │ TR     │$19.99 │    0   │  │
│  │ 🟢 │ UK 10GB    │ ESIM  │ GB     │$34.95 │   ∞    │  │
│  └────┴────────────┴───────┴────────┴───────┴────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 5.2 Product Create/Edit
```
┌──────────────────────────────────────────────────────────┐
│  [Logo]  [Dashboard] [Orders] [Products] [Users]  [👤]  │
├──────────────────────────────────────────────────────────┤
│  Add Product                                             │
│                                                          │
│  ┌─ Product Details ──────────────────────────────────┐  │
│  │  Name                    [input]                    │  │
│  │  Description             [textarea]                 │  │
│  │  Type                    [ESIM ▾]                   │  │
│  │  Country                 [Select... ▾]              │  │
│  │  Region                  [Optional ▾]               │  │
│  │  Cost Price              [input]                    │  │
│  │  Selling Price           [input]                    │  │
│  │  Currency                [USD ▾]                    │  │
│  │  Stock (∞ = unlimited)  [input]                    │  │
│  │  Telna Product ID        [input]                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Specifications ───────────────────────────────────┐  │
│  │  Data Volume             [input] [GB ▾]            │  │
│  │  Validity                [input] [DAY ▾]           │  │
│  │  Speed Cap               [input]                   │  │
│  │  Roaming                 [Yes / No]                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [Cancel]                              [Save Product]    │
└──────────────────────────────────────────────────────────┘
```

---

## 6. User & Tenant Management

### 6.1 User List (Admin View)
```
┌──────────────────────────────────────────────────────────┐
│  [Logo]  [Dashboard] [Orders] [Products] [Users]  [👤]  │
├──────────────────────────────────────────────────────────┤
│  Users                                    [+ Add User]   │
│                                                          │
│  [Search...]        [Role: All ▾] [Tenant ▾]            │
│                                                          │
│  ┌────┬──────────┬──────────┬────────┬────────┬──────┐  │
│  │    │ Name     │ Email    │ Role   │ Tenant │Status│  │
│  │    ├──────────┼──────────┼────────┼────────┼──────┤  │
│  │ 👤 │ Ahmet Y. │ ahmet@..│ Dist.  │ Dist A │ Active│  │
│  │ 👤 │ Mehmet K.│ mehmet@.│ Dealer │ Dealer1│ Active│  │
│  │ 👤 │ Ayse S.  │ ayse@.. │ Emp.   │ Dealer1│ Active│  │
│  │ 👤 │ Ali R.   │ ali@..  │ Cust.  │ Dealer1│ Active│  │
│  └────┴──────────┴──────────┴────────┴────────┴──────┘  │
└──────────────────────────────────────────────────────────┘
```

### 6.2 Tenant Hierarchy Tree
```
┌──────────────────────────────────────────────────────────┐
│  [Logo]  [Dashboard] [Orders] [Products] [Users]  [👤]  │
├──────────────────────────────────────────────────────────┤
│  Tenant Hierarchy                                       │
│                                                          │
│  📂 Distributor A  (root)                               │
│  ├── 📂 Dealer Alpha                                     │
│  │   ├── 📂 Sub Dealer Alpha-1                           │
│  │   │   ├── 👤 Employee 1                               │
│  │   │   └── 👤 Employee 2                               │
│  │   └── 📂 Sub Dealer Alpha-2                           │
│  ├── 📂 Dealer Beta                                      │
│  │   └── 📂 Sub Dealer Beta-1                            │
│  └── 📂 Dealer Gamma                                     │
│                                                          │
│  [+ Add Dealer]  [+ Add Sub Dealer]                     │
└──────────────────────────────────────────────────────────┘
```

---

## 7. eSIM Management

### 7.1 eSIM Detail & QR Code
```
┌──────────────────────────────────────────────────────────┐
│  [Logo]  [Dashboard] [Orders] [Products] [Users]  [👤]  │
├──────────────────────────────────────────────────────────┤
│  eSIM Details                                            │
│                                                          │
│  ICCID: 8944 1234 5678 9012 3456                         │
│  Status: ● Active                                        │
│                                                          │
│  ┌──────────────────────┐  ┌─ Info ───────────────────┐ │
│  │                      │  │  Product: Europe 5GB     │ │
│  │    [QR Code]         │  │  Customer: John Doe      │ │
│  │                      │  │  Activated: 22 Jul 2026  │ │
│  │                      │  │  Expires: 21 Aug 2026    │ │
│  │                      │  │  Plan: 5GB @ 4G/LTE      │ │
│  └──────────────────────┘  └──────────────────────────┘ │
│                                                          │
│  ┌─ Usage ────────────────────────────────────────────┐  │
│  │  Used: 1.2 GB / 5 GB                    [████░░░░] │  │
│  │  Voice: 0 min / 0 min                              │  │
│  │  SMS: 0 / 0                                        │  │
│  │                                                     │  │
│  │  [Download Usage Report]                            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [Suspend eSIM]  [Terminate eSIM]  [Download QR]        │
└──────────────────────────────────────────────────────────┘
```

---

## 8. Reports

### 8.1 Sales Report
```
┌──────────────────────────────────────────────────────────┐
│  [Logo]  [Dashboard] [Orders] [Products] [Users]  [👤]  │
├──────────────────────────────────────────────────────────┤
│  Sales Report                                            │
│                                                          │
│  [From: ▾]  [To: ▾]  [Tenant: All ▾]  [Apply] [Export] │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [Line Chart — Daily Sales]                        │  │
│  │                                                    │  │
│  │  $2,500 ┤                                           │  │
│  │  $2,000 ┤    ╱╲    ╱╲                               │  │
│  │  $1,500 ┤ ╱╱  ╲╲  ╱  ╲╲                            │  │
│  │  $1,000 ┤╱     ╲╲╱    ╲╲                           │  │
│  │     0   ┼──────────────────────────                 │  │
│  │        16  17  18  19  20  21  22                  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────┬──────────┬──────────┬──────────┐          │
│  │ Total    │ Orders   │ Avg.     │ Top      │          │
│  │ Revenue  │          │ Order    │ Product  │          │
│  ├──────────┼──────────┼──────────┼──────────┤          │
│  │ $12,450  │ 245      │ $50.82   │ Europe   │          │
│  │          │          │          │ 5GB      │          │
│  └──────────┴──────────┴──────────┴──────────┘          │
└──────────────────────────────────────────────────────────┘
```

---

## 9. Navigation Structure

```
Main Navigation (Sidebar / Topbar)
├── Dashboard
├── Orders
│   ├── All Orders
│   └── Create Order
├── Products
│   ├── All Products
│   ├── Add Product
│   └── Sync from Telna
├── eSIMs
│   └── All eSIMs
├── Users
│   ├── All Users
│   ├── Add User
│   └── Tenant Hierarchy
├── Reports
│   ├── Sales Report
│   ├── Usage Report
│   └── Commission Report
├── Settings
│   ├── Profile
│   ├── Tenant Settings
│   └── API Keys
└── Help & Support
```

---

## 10. Responsive Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 640px | Single column, hamburger menu |
| Tablet | 640px - 1024px | Two column, collapsed sidebar |
| Desktop | > 1024px | Full layout with sidebar |
| Wide | > 1440px | Max-width container centered |
