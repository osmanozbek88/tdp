


import type { UserRole } from "@prisma/client";
import type { PermissionCode } from "@/lib/auth/permissions";
import {
  getAllPermissions,
  getRolePermissions,
  getAllRolePermissions,
  setRolePermission as setRolePermissionInDB,
  removeRolePermission as removeRolePermissionInDB,
  getRolePermissionCodes,
} from "@/lib/auth/permission-repository";

export interface PermissionWithRoles {
  id: string;
  code: PermissionCode;
  description: string | null;
  group: string;
  roles: UserRole[];
}

export interface RolePermissionMap {
  [role: string]: {
    role: UserRole;
    permissions: PermissionCode[];
  };
}

/**
 * Get all permissions with their assigned roles.
 */
export async function getPermissionsWithRoles(): Promise<PermissionWithRoles[]> {
  const [allPerms, allRolePerms] = await Promise.all([
    getAllPermissions(),
    getAllRolePermissions(),
  ]);

  const roleMap: Record<string, UserRole[]> = {};
  for (const rp of allRolePerms) {
    if (!roleMap[rp.permissionId]) roleMap[rp.permissionId] = [];
    roleMap[rp.permissionId]!.push(rp.role);
  }

  return allPerms.map((p) => ({
    id: p.id,
    code: p.code as PermissionCode,
    description: p.description,
    group: p.group,
    roles: roleMap[p.id] ?? [],
  }));
}

/**
 * Get all role permission mappings.
 */
export async function getRolePermissionMap(): Promise<RolePermissionMap> {
  const allRolePerms = await getAllRolePermissions();

  const map: RolePermissionMap = {};
  for (const rp of allRolePerms) {
    if (!map[rp.role]) {
      map[rp.role] = { role: rp.role, permissions: [] };
    }
    map[rp.role]!.permissions.push(rp.permission.code as PermissionCode);
  }
  return map;
}

/**
 * Set (assign) a permission to a role.
 */
export async function grantPermission(
  role: UserRole,
  permissionId: string,
) {
  return setRolePermissionInDB(role, permissionId);
}

/**
 * Remove a permission from a role.
 */
export async function revokePermission(
  role: UserRole,
  permissionId: string,
) {
  return removeRolePermissionInDB(role, permissionId);
}

/**
 * Get effective permission codes for a role (from DB).
 * Falls back to empty array if none configured.
 */
export async function getEffectivePermissions(role: UserRole): Promise<PermissionCode[]> {
  return getRolePermissionCodes(role);
}


