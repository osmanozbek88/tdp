



import { ForbiddenError } from "@/lib/errors";
import { getRolePermissionCodes } from "@/lib/auth/permission-repository";
import type { PermissionCode } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";

/**
 * In-memory cache for role permissions (TTL ~60s).
 * Cleared on permission changes via POST /api/auth/permissions.
 */
const permissionCache = new Map<string, { permissions: PermissionCode[]; expiresAt: number }>();

const CACHE_TTL_MS = 60_000; // 1 minute

export function clearPermissionCache(role?: UserRole): void {
  if (role) {
    permissionCache.delete(role);
  } else {
    permissionCache.clear();
  }
}

async function loadPermissions(role: UserRole): Promise<PermissionCode[]> {
  const cached = permissionCache.get(role);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.permissions;
  }

  const permissions = await getRolePermissionCodes(role);
  permissionCache.set(role, { permissions, expiresAt: Date.now() + CACHE_TTL_MS });
  return permissions;
}

/**
 * Require a specific permission for the current request.
 * Throws ForbiddenError if the user role lacks the permission.
 *
 * Usage in API routes:
 *   await requirePermission(userRole, "Orders.Create");
 */
export async function requirePermission(
  userRole: UserRole,
  requiredPermission: PermissionCode,
): Promise<void> {
  const permissions = await loadPermissions(userRole);
  if (!permissions.includes(requiredPermission)) {
    throw new ForbiddenError(
      `Bu işlem için "${requiredPermission}" yetkisine sahip olmanız gerekmektedir.`,
    );
  }
}

/**
 * Require ANY of the given permissions.
 */
export async function requireAnyPermission(
  userRole: UserRole,
  requiredPermissions: PermissionCode[],
): Promise<void> {
  const permissions = await loadPermissions(userRole);
  const hasAny = requiredPermissions.some((p) => permissions.includes(p));
  if (!hasAny) {
    throw new ForbiddenError(
      `Bu işlem için şu yetkilerden en az birine sahip olmanız gerekmektedir: ${requiredPermissions.join(", ")}`,
    );
  }
}

/**
 * Get all permission codes for a user role (with caching).
 */
export async function getUserPermissions(userRole: UserRole): Promise<PermissionCode[]> {
  return loadPermissions(userRole);
}



