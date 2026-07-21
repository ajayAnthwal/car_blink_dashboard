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
