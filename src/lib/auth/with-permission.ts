import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permission-guard";
import { handleApiError } from "@/lib/error-handler";
import type { PermissionCode } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";

/**
 * Route handler signature — supports both plain and [id]-style handlers.
 */
type RouteHandler<T = unknown> = (
  req: NextRequest,
  context?: T,
) => Promise<NextResponse>;

/**
 * Wrap a route handler with fine-grained permission check.
 *
 * Extracts the user's role from the `x-user-role` header (set by middleware)
 * and calls `requirePermission()` before delegating to the actual handler.
 *
 * @example
 * export const POST = withPermission("Dealers.Create", async (req) => {
 *   return dealerController.create(req);
 * });
 */
export function withPermission<T = unknown>(
  permission: PermissionCode,
  handler: RouteHandler<T>,
): RouteHandler<T> {
  return async (req: NextRequest, context?: T) => {
    try {
      const userRole = (req.headers.get("x-user-role") || "CUSTOMER") as UserRole;
      await requirePermission(userRole, permission);
      return await handler(req, context);
    } catch (e) {
      return handleApiError(e);
    }
  };
}
