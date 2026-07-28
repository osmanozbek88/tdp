


/**
 * Role hierarchy mapping.
 * Each role includes all permissions of roles below it.
 */
export const ROLE_HIERARCHY: Record<string, string[]> = {
  SUPER_ADMIN: [
    "DISTRIBUTOR_ADMIN",
    "DISTRIBUTOR_STAFF",
    "DEALER_ADMIN",
    "DEALER_STAFF",
    "SUB_DEALER_ADMIN",
    "SUB_DEALER_STAFF",
    "EMPLOYEE",
    "CUSTOMER",
  ],
  DISTRIBUTOR_ADMIN: [
    "DISTRIBUTOR_STAFF",
    "DEALER_ADMIN",
    "DEALER_STAFF",
    "SUB_DEALER_ADMIN",
    "SUB_DEALER_STAFF",
    "EMPLOYEE",
    "CUSTOMER",
  ],
  DISTRIBUTOR_STAFF: [
    "DEALER_ADMIN",
    "DEALER_STAFF",
    "SUB_DEALER_ADMIN",
    "SUB_DEALER_STAFF",
    "EMPLOYEE",
    "CUSTOMER",
  ],
  DEALER_ADMIN: [
    "DEALER_STAFF",
    "SUB_DEALER_ADMIN",
    "SUB_DEALER_STAFF",
    "EMPLOYEE",
    "CUSTOMER",
  ],
  DEALER_STAFF: ["SUB_DEALER_ADMIN", "SUB_DEALER_STAFF", "EMPLOYEE", "CUSTOMER"],
  SUB_DEALER_ADMIN: ["SUB_DEALER_STAFF", "EMPLOYEE", "CUSTOMER"],
  SUB_DEALER_STAFF: ["EMPLOYEE", "CUSTOMER"],
  EMPLOYEE: ["CUSTOMER"],
  CUSTOMER: [],
};

/**
 * Check if `userRole` has equal or higher privileges than `requiredRole`.
 */
export function hasRole(userRole: string, requiredRole: string): boolean {
  if (userRole === requiredRole) return true;
  const subordinates = ROLE_HIERARCHY[userRole];
  if (!subordinates) return false;
  return subordinates.includes(requiredRole);
}

/**
 * Require minimum role. Returns true if userRole >= requiredRole in the hierarchy.
 */
export function requireRole(
  userRole: string,
  requiredRole: string,
): boolean {
  return hasRole(userRole, requiredRole);
}


