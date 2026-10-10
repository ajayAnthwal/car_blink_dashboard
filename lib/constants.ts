export const ROLES = {
  CUSTOMER: "CUSTOMER",
  PARTNER: "PARTNER",
  EXECUTIVE: "EXECUTIVE",
  ACCOUNTS: "ACCOUNTS",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type Role = keyof typeof ROLES;

export const ROLE_ROUTES: Record<string, string> = {
  [ROLES.CUSTOMER]: "/customer/dashboard",
  [ROLES.PARTNER]: "/partner/dashboard",
  [ROLES.EXECUTIVE]: "/executive/dashboard",
  [ROLES.ACCOUNTS]: "/accounts/dashboard",
  [ROLES.SUPER_ADMIN]: "/admin/dashboard",
  ADMIN: "/admin/dashboard",
  customer: "/customer/dashboard",
  partner: "/partner/dashboard",
  executive: "/executive/dashboard",
  accounts: "/accounts/dashboard",
  super_admin: "/admin/dashboard",
  admin: "/admin/dashboard",
};

export const CUSTOMER_ROUTES = {
  DASHBOARD: "/customer/dashboard",
  GARAGE: "/customer/garage",
  BOOKINGS: "/customer/bookings",
  WARRANTIES: "/customer/warranty",
  SUPPORT: "/customer/support",
  PAYMENTS: "/customer/payments",
  REVIEWS: "/customer/reviews",
  PROFILE: "/customer/profile",
} as const;

/**
 * Authoritative destination resolver based on role and partner verification status.
 * Ensures partner logins never fall back to /customer/dashboard.
 */
export function getRoleDestination(user: any): string {
  if (!user || !user.role) return "/login";
  const role = String(user.role).toUpperCase();
  if (role === "PARTNER") {
    const status = user.verificationStatus || user.partnerInfo?.verificationStatus;
    const isVerified = Boolean(user.isVerified || user.partnerInfo?.isVerified);
    const isActive = user.isActive !== false && user.partnerInfo?.isActive !== false;
    const isApproved =
      (status === "APPROVED_VERIFIED" || status === "APPROVED") &&
      isVerified &&
      isActive;
    return isApproved ? "/partner/dashboard" : "/partner/kyc";
  }
  if (role === "CUSTOMER") return "/customer/dashboard";
  if (role === "EXECUTIVE") return "/executive/dashboard";
  if (role === "ACCOUNTS") return "/accounts/dashboard";
  if (role === "SUPER_ADMIN" || role === "ADMIN") return "/admin/dashboard";
  return ROLE_ROUTES[role] || "/login";
}

