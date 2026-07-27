


import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

let cachedSecret: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (!cachedSecret) {
    const raw = process.env.AUTH_SECRET;
    if (!raw || raw.length < 32) {
      throw new Error("AUTH_SECRET is not set or too short (< 32 chars)");
    }
    cachedSecret = new TextEncoder().encode(raw);
  }
  return cachedSecret;
}

/**
 * Paths that do NOT require authentication.
 */
const PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/health",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/",
];

/**
 * Paths that require authentication but are open to any authenticated user.
 */
const AUTHENTICATED_API_PREFIXES = [
  "/api/auth/me",
  "/api/auth/resend-verification",
  "/api/auth/mfa",
  "/api/",
];

const AUTHENTICATED_PAGE_PREFIXES = ["/dashboard"];

// ─── RBAC: Role-based route restrictions ───

type UserRole =
  | "SUPER_ADMIN"
  | "DISTRIBUTOR_ADMIN"
  | "DISTRIBUTOR_STAFF"
  | "DEALER_ADMIN"
  | "DEALER_STAFF"
  | "SUB_DEALER_ADMIN"
  | "SUB_DEALER_STAFF"
  | "EMPLOYEE"
  | "CUSTOMER";

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  DISTRIBUTOR_ADMIN: 80,
  DISTRIBUTOR_STAFF: 75,
  DEALER_ADMIN: 60,
  DEALER_STAFF: 55,
  SUB_DEALER_ADMIN: 40,
  SUB_DEALER_STAFF: 35,
  EMPLOYEE: 20,
  CUSTOMER: 10,
};

interface RoleRule {
  minLevel: number;
  allowedRoles?: UserRole[];
}

/**
 * Path prefix → minimum role level or explicit allowed roles.
 * More specific prefixes should come first (they are checked in order).
 */
const ROLE_PROTECTED_PATHS: Array<{ prefix: string; rule: RoleRule }> = [
  // Admin panel → SUPER_ADMIN only
  { prefix: "/dashboard/admin", rule: { minLevel: ROLE_HIERARCHY.SUPER_ADMIN } },
  { prefix: "/api/admin", rule: { minLevel: ROLE_HIERARCHY.SUPER_ADMIN } },
  // Permission management → SUPER_ADMIN only
  { prefix: "/api/auth/permissions", rule: { minLevel: ROLE_HIERARCHY.SUPER_ADMIN } },
  // Tenant management → distributor+
  { prefix: "/dashboard/tenants", rule: { minLevel: ROLE_HIERARCHY.DISTRIBUTOR_ADMIN } },
  { prefix: "/api/tenants", rule: { minLevel: ROLE_HIERARCHY.DISTRIBUTOR_ADMIN } },
  // User management → dealer+
  { prefix: "/dashboard/users", rule: { minLevel: ROLE_HIERARCHY.DEALER_ADMIN } },
  { prefix: "/api/users", rule: { minLevel: ROLE_HIERARCHY.DEALER_ADMIN } },
  // Reports → employee+
  { prefix: "/dashboard/reports", rule: { minLevel: ROLE_HIERARCHY.EMPLOYEE } },
  { prefix: "/api/reports", rule: { minLevel: ROLE_HIERARCHY.EMPLOYEE } },
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => {
    if (p === "/") return pathname === "/";
    return pathname.startsWith(p);
  });
}

function isAuthenticatedPath(pathname: string): boolean {
  return (
    AUTHENTICATED_API_PREFIXES.some((p) => pathname.startsWith(p)) ||
    AUTHENTICATED_PAGE_PREFIXES.some((p) => pathname.startsWith(p))
  );
}

function checkRoleAccess(pathname: string, role: string): boolean {
  for (const { prefix, rule } of ROLE_PROTECTED_PATHS) {
    if (pathname.startsWith(prefix)) {
      const userLevel = ROLE_HIERARCHY[role as UserRole] ?? 0;
      if (rule.allowedRoles) {
        return rule.allowedRoles.includes(role as UserRole);
      }
      if (rule.minLevel) {
        return userLevel >= rule.minLevel;
      }
    }
  }
  // If the path is not in the restricted list, any authenticated user can access
  return true;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // DEBUG: Check if middleware is running
  console.log(`[MIDDLEWARE] ${req.method} ${pathname} — cookies:`, req.cookies.getAll().map(c => c.name));

  // Allow public paths without authentication
  if (isPublicPath(pathname)) {
    console.log(`[MIDDLEWARE] ${pathname} → PUBLIC, allowed`);
    return NextResponse.next();
  }

  // Only check auth for paths that require it
  if (!isAuthenticatedPath(pathname)) {
    console.log(`[MIDDLEWARE] ${pathname} → NOT AUTHENTICATED PATH, skipping`);
    return NextResponse.next();
  }

  // Extract token from Authorization header or cookies
  let token: string | undefined;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  // Fallback: also check cookies (for client-side fetch with credentials: 'include')
  if (!token) {
    token = req.cookies.get("accessToken")?.value;
  }

  // No token → 401 for API, redirect for pages
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Kimlik doğrulaması gerekli",
          },
        },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);

    const userRole = (payload.role as string) ?? "CUSTOMER";

    // RBAC check
    if (!checkRoleAccess(pathname, userRole)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Bu işlem için yetkiniz bulunmamaktadır",
            },
          },
          { status: 403 },
        );
      }
      // Page routes: redirect to dashboard with a forbidden flag
      const forbiddenUrl = new URL("/dashboard", req.url);
      forbiddenUrl.searchParams.set("forbidden", "1");
      return NextResponse.redirect(forbiddenUrl);
    }

    // Clone headers with user info for downstream usage
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", payload.sub as string);
    requestHeaders.set("x-user-email", payload.email as string);
    requestHeaders.set("x-user-role", userRole);
    requestHeaders.set("x-user-tenant-id", payload.tenantId as string);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Geçersiz veya süresi dolmuş token",
          },
        },
        { status: 401 },
      );
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/api/:path*", "/dashboard", "/dashboard/:path*"],
};



