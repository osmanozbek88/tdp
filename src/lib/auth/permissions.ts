

/**
 * Fine-grained permission codes.
 * Each group matches a domain: Orders, Products, Users, etc.
 */
export const ALL_PERMISSIONS = {
  // Orders
  "Orders.Create": "Sipariş oluşturma",
  "Orders.View": "Sipariş görüntüleme",
  "Orders.Edit": "Sipariş düzenleme",
  "Orders.Delete": "Sipariş silme",
  "Orders.Approve": "Sipariş onaylama",
  "Orders.Refund": "İade işlemi",

  // Products
  "Products.Create": "Ürün oluşturma",
  "Products.View": "Ürün görüntüleme",
  "Products.Edit": "Ürün düzenleme",
  "Products.Delete": "Ürün silme",

  // eSIM
  "ESim.View": "eSIM görüntüleme",
  "ESim.Activate": "eSIM aktifleştirme",
  "ESim.Suspend": "eSIM askıya alma",
  "ESim.Reactivate": "eSIM yeniden aktifleştirme",
  "ESim.Terminate": "eSIM sonlandırma",

  // Users
  "Users.Create": "Kullanıcı oluşturma",
  "Users.View": "Kullanıcı görüntüleme",
  "Users.Edit": "Kullanıcı düzenleme",
  "Users.Delete": "Kullanıcı silme",

  // Dealers
  "Dealers.Create": "Bayi oluşturma",
  "Dealers.View": "Bayi görüntüleme",
  "Dealers.Edit": "Bayi düzenleme",
  "Dealers.Delete": "Bayi silme",

  // Tenants
  "Tenants.Create": "Tenant oluşturma",
  "Tenants.View": "Tenant görüntüleme",
  "Tenants.Edit": "Tenant düzenleme",
  "Tenants.Delete": "Tenant silme",

  // Reports
  "Reports.View": "Rapor görüntüleme",
  "Reports.Export": "Rapor dışa aktarma",

  // Admin
  "Admin.Access": "Admin paneline erişim",
  "Admin.ManageRoles": "Rol ve yetki yönetimi",

  // Webhooks
  "Webhooks.View": "Webhook görüntüleme",
  "Webhooks.Process": "Webhook işleme",
} as const;

export type PermissionCode = keyof typeof ALL_PERMISSIONS;

export type PermissionGroup = string;

export interface PermissionInfo {
  code: PermissionCode;
  description: string;
  group: PermissionGroup;
}

/**
 * Get the group name from a permission code (e.g., "Orders.Create" → "Orders").
 */
export function getPermissionGroup(code: PermissionCode): PermissionGroup {
  return code.split(".")[0] ?? "Other";
}

/**
 * Default role → permission assignments.
 * SUPER_ADMIN gets ALL permissions (handled in code, not listed here).
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionCode[]> = {
  SUPER_ADMIN: Object.keys(ALL_PERMISSIONS) as PermissionCode[],

  DISTRIBUTOR_ADMIN: [
    "Orders.Create", "Orders.View", "Orders.Edit", "Orders.Approve",
    "Products.View",
    "ESim.View", "ESim.Activate",
    "Users.Create", "Users.View", "Users.Edit",
    "Dealers.Create", "Dealers.View", "Dealers.Edit",
    "Reports.View", "Reports.Export",
    "Webhooks.View",
  ],

  DISTRIBUTOR_STAFF: [
    "Orders.Create", "Orders.View",
    "Products.View",
    "ESim.View", "ESim.Activate",
    "Users.View",
    "Dealers.View",
    "Reports.View",
    "Webhooks.View",
  ],

  DEALER_ADMIN: [
    "Orders.Create", "Orders.View",
    "Products.View",
    "ESim.View", "ESim.Activate",
    "Users.Create", "Users.View", "Users.Edit",
    "Reports.View",
  ],

  DEALER_STAFF: [
    "Orders.Create", "Orders.View",
    "Products.View",
    "ESim.View",
    "Users.View",
    "Reports.View",
  ],

  SUB_DEALER_ADMIN: [
    "Orders.Create", "Orders.View",
    "Products.View",
    "ESim.View", "ESim.Activate",
    "Users.View",
    "Reports.View",
  ],

  SUB_DEALER_STAFF: [
    "Orders.Create", "Orders.View",
    "Products.View",
    "ESim.View",
    "Users.View",
    "Reports.View",
  ],

  EMPLOYEE: [
    "Orders.View",
    "Products.View",
    "ESim.View",
    "Reports.View",
  ],

  CUSTOMER: [
    "Orders.View",
    "Products.View",
    "ESim.View",
  ],
};

/**
 * Check if a user role has a specific permission.
 * Use this on the server side after loading actual permissions from DB.
 */
export function hasPermission(
  rolePermissions: PermissionCode[],
  required: PermissionCode,
): boolean {
  return rolePermissions.includes(required);
}

/**
 * Check if user has ANY of the given permissions.
 */
export function hasAnyPermission(
  rolePermissions: PermissionCode[],
  required: PermissionCode[],
): boolean {
  return required.some((p) => rolePermissions.includes(p));
}
