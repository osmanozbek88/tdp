

import { NextResponse } from "next/server";
import { getPermissionsWithRoles, grantPermission, revokePermission } from "@/lib/auth/permission-service";
import { getRolePermissionCodes } from "@/lib/auth/permission-repository";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";

const VALID_ROLES: UserRole[] = [
  "SUPER_ADMIN", "DISTRIBUTOR_ADMIN", "DISTRIBUTOR_STAFF",
  "DEALER_ADMIN", "DEALER_STAFF", "SUB_DEALER_ADMIN", "SUB_DEALER_STAFF",
  "EMPLOYEE", "CUSTOMER",
];

function isValidRole(role: string): role is UserRole {
  return VALID_ROLES.includes(role as UserRole);
}

// GET /api/auth/permissions — list all permissions with roles
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role");
  const defaultFlag = searchParams.get("default");

  // Return default permission mapping (from code, not DB)
  if (defaultFlag === "true") {
    return NextResponse.json({ success: true, data: DEFAULT_ROLE_PERMISSIONS });
  }

  // Return effective permissions for a single role
  if (role) {
    if (!isValidRole(role)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: `Geçersiz rol: ${role}` } },
        { status: 422 },
      );
    }
    const codes = await getRolePermissionCodes(role as UserRole);
    return NextResponse.json({ success: true, data: { role, permissions: codes } });
  }

  // Return all permissions with their assigned roles
  const permissions = await getPermissionsWithRoles();
  return NextResponse.json({ success: true, data: permissions });
}

// POST /api/auth/permissions — grant or revoke a permission
export async function POST(req: Request) {
  const { role, permissionId, action } = await req.json();

  if (!isValidRole(role)) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: `Geçersiz rol: ${role}` } },
      { status: 422 },
    );
  }

  if (action === "grant") {
    const result = await grantPermission(role as UserRole, permissionId);
    return NextResponse.json({ success: true, data: result });
  }

  if (action === "revoke") {
    const result = await revokePermission(role as UserRole, permissionId);
    return NextResponse.json({ success: true, data: result });
  }

  return NextResponse.json(
    { success: false, error: { code: "VALIDATION_ERROR", message: "action 'grant' veya 'revoke' olmalı" } },
    { status: 422 },
  );
}

