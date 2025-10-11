export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "CloudRadius";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const TENANT_HEADER = "x-tenant-id";

export const USER_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  TENANT_ADMIN: "TENANT_ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  COLLECTOR: "COLLECTOR",
  FRANCHISE: "FRANCHISE",
  SUBSCRIBER: "SUBSCRIBER",
} as const;

export const TENANT_STATUSES = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
  TRIAL: "TRIAL",
} as const;

export const SUBSCRIBER_STATUSES = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  DISABLED: "DISABLED",
  SUSPENDED: "SUSPENDED",
  TRIAL: "TRIAL",
} as const;

export const PLAN_TIERS = {
  STARTER: "STARTER",
  GROWTH: "GROWTH",
  PROFESSIONAL: "PROFESSIONAL",
  ENTERPRISE: "ENTERPRISE",
} as const;

export const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { title: "Subscribers", href: "/subscribers", icon: "Users" },
  { title: "Plans", href: "/plans", icon: "Package" },
  { title: "Billing", href: "/billing", icon: "Receipt" },
  { title: "Vouchers", href: "/vouchers", icon: "Ticket" },
  { title: "NAS Devices", href: "/nas", icon: "Router" },
  { title: "Locations", href: "/locations", icon: "MapPin" },
  { title: "Online Users", href: "/online-users", icon: "Wifi" },
  { title: "Complaints", href: "/complaints", icon: "MessageSquare" },
  { title: "Leads", href: "/leads", icon: "UserPlus" },
  { title: "Reports", href: "/reports", icon: "BarChart3" },
  { title: "Settings", href: "/settings", icon: "Settings" },
] as const;
