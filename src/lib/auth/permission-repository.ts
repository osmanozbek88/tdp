


import { prisma } from "@/lib/prisma";
import type { PermissionCode } from "@/lib/auth/permissions";
import type { Permission, RolePermission, UserRole } from "@prisma/client";

export type PermissionRecord = Permission;
export type RolePermissionRecord = RolePermission & { permission: Permission };

export async function getAllPermissions(): Promise<PermissionRecord[]> {
  return prisma.permission.findMany({ orderBy: { group: "asc" } });
}

export async function getPermissionByCode(code: PermissionCode): Promise<PermissionRecord | null> {
  return prisma.permission.findUnique({ where: { code } });
}

export async function getRolePermissions(role: UserRole): Promise<RolePermissionRecord[]> {
  return prisma.rolePermission.findMany({
    where: { role },
    include: { permission: true },
  });
}

export async function getAllRolePermissions(): Promise<RolePermissionRecord[]> {
  return prisma.rolePermission.findMany({
    include: { permission: true },
  });
}

export async function setRolePermission(
  role: UserRole,
  permissionId: string,
): Promise<RolePermissionRecord> {
  return prisma.rolePermission.upsert({
    where: {
      role_permissionId: { role, permissionId },
    },
    create: { role, permissionId },
    update: {},
    include: { permission: true },
  });
}

export async function removeRolePermission(
  role: UserRole,
  permissionId: string,
): Promise<RolePermissionRecord> {
  return prisma.rolePermission.delete({
    where: {
      role_permissionId: { role, permissionId },
    },
    include: { permission: true },
  });
}

export async function getRolePermissionCodes(role: UserRole): Promise<PermissionCode[]> {
  const records = await prisma.rolePermission.findMany({
    where: { role },
    include: { permission: true },
  });
  return records.map((r) => r.permission.code as PermissionCode);
}

