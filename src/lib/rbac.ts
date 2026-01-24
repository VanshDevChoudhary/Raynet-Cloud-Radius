import type { UserRole } from "@/generated/prisma";

export type Module =
  | "dashboard"
  | "subscribers"
  | "plans"
  | "billing"
  | "payments"
  | "vouchers"
  | "nas"
  | "locations"
  | "online_users"
  | "sessions"
  | "complaints"
  | "leads"
  | "reports"
  | "settings"
  | "users"
  | "super_admin";

export type Action = "view" | "create" | "edit" | "delete" | "export";

export type Permission = `${Module}:${Action}` | `${Module}:*` | "*";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: ["*"],

  TENANT_ADMIN: [
    "dashboard:*",
    "subscribers:*",
    "plans:*",
    "billing:*",
    "payments:*",
    "vouchers:*",
    "nas:*",
    "locations:*",
    "online_users:*",
    "sessions:*",
    "complaints:*",
    "leads:*",
    "reports:*",
    "settings:*",
    "users:*",
  ],

  MANAGER: [
    "dashboard:view",
    "subscribers:*",
    "plans:view",
    "billing:view",
    "billing:export",
    "payments:view",
    "payments:create",
    "payments:export",
    "vouchers:view",
    "vouchers:create",
    "vouchers:export",
    "nas:view",
    "locations:view",
    "online_users:view",
    "sessions:view",
    "complaints:*",
    "leads:*",
    "reports:*",
  ],

  STAFF: [
    "dashboard:view",
    "subscribers:view",
    "plans:view",
    "billing:view",
    "payments:view",
    "payments:create",
    "vouchers:view",
    "nas:view",
    "online_users:view",
    "sessions:view",
    "complaints:view",
    "complaints:create",
    "complaints:edit",
    "leads:view",
    "leads:create",
    "leads:edit",
    "reports:view",
  ],

  COLLECTOR: [
    "dashboard:view",
    "subscribers:view",
    "payments:view",
    "payments:create",
    "billing:view",
  ],

  FRANCHISE: [
    "dashboard:view",
    "subscribers:view",
    "subscribers:create",
    "subscribers:edit",
    "plans:view",
    "billing:view",
    "payments:view",
    "payments:create",
    "vouchers:view",
    "online_users:view",
    "sessions:view",
    "complaints:view",
    "complaints:create",
    "complaints:edit",
    "reports:view",
  ],

  SUBSCRIBER: [],
};

export function hasPermission(
  role: UserRole,
  module: Module,
  action: Action
): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];

  // Wildcard: full access
  if (permissions.includes("*")) return true;

  // Module wildcard: module:*
  if (permissions.includes(`${module}:*` as Permission)) return true;

  // Specific permission: module:action
  if (permissions.includes(`${module}:${action}` as Permission)) return true;

  return false;
}

export function hasAnyPermission(
  role: UserRole,
  module: Module
): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  if (permissions.includes("*")) return true;
  return permissions.some(
    (p) => p === `${module}:*` || p.startsWith(`${module}:`)
  );
}

export function authorize(
  role: UserRole,
  module: Module,
  action: Action
): void {
  if (!hasPermission(role, module, action)) {
    throw new Error(
      `Forbidden: ${role} cannot ${action} ${module}`
    );
  }
}

// Nav items and role-based filtering

interface NavItem {
  title: string;
  href: string;
  icon: string;
  requiredModule: Module;
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", requiredModule: "dashboard" },
  { title: "Subscribers", href: "/subscribers", icon: "Users", requiredModule: "subscribers" },
  { title: "Plans", href: "/plans", icon: "Package", requiredModule: "plans" },
  { title: "Invoices", href: "/billing/invoices", icon: "FileText", requiredModule: "billing" },
  { title: "Payments", href: "/billing/payments", icon: "CreditCard", requiredModule: "payments" },
  { title: "Vouchers", href: "/vouchers", icon: "Ticket", requiredModule: "vouchers" },
  { title: "NAS Devices", href: "/nas", icon: "Router", requiredModule: "nas" },
  { title: "Locations", href: "/locations", icon: "MapPin", requiredModule: "locations" },
  { title: "Online Users", href: "/online-users", icon: "Wifi", requiredModule: "online_users" },
  { title: "Sessions", href: "/sessions", icon: "History", requiredModule: "sessions" },
  { title: "Complaints", href: "/complaints", icon: "MessageSquare", requiredModule: "complaints" },
  { title: "Leads", href: "/leads", icon: "UserPlus", requiredModule: "leads" },
  { title: "Reports", href: "/reports", icon: "BarChart3", requiredModule: "reports" },
  { title: "Captive Portal", href: "/settings/captive-portal", icon: "Globe", requiredModule: "settings" },
  { title: "Settings", href: "/settings", icon: "Settings", requiredModule: "settings" },
];

export const SUPER_ADMIN_NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/super-admin/dashboard", icon: "LayoutDashboard", requiredModule: "super_admin" },
  { title: "Tenants", href: "/super-admin/tenants", icon: "Building2", requiredModule: "super_admin" },
  { title: "System Settings", href: "/super-admin/settings", icon: "Settings", requiredModule: "super_admin" },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  if (role === "SUPER_ADMIN") return SUPER_ADMIN_NAV_ITEMS;
  return ADMIN_NAV_ITEMS.filter((item) => hasAnyPermission(role, item.requiredModule));
}

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  TENANT_ADMIN: "Admin",
  MANAGER: "Manager",
  STAFF: "Operator",
  COLLECTOR: "Viewer",
  FRANCHISE: "Franchise",
  SUBSCRIBER: "Subscriber",
};

export const ASSIGNABLE_ROLES: UserRole[] = [
  "TENANT_ADMIN",
  "MANAGER",
  "STAFF",
  "COLLECTOR",
  "FRANCHISE",
];
