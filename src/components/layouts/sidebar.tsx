"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  Receipt,
  Ticket,
  Router,
  MapPin,
  Wifi,
  History,
  MessageSquare,
  UserPlus,
  BarChart3,
  Settings,
  Radio,
  ChevronLeft,
  FileText,
  CreditCard,
  Globe,
  Building2,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { getNavItemsForRole } from "@/lib/rbac";
import type { UserRole } from "@/generated/prisma";
import { useState } from "react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  Package,
  Receipt,
  Ticket,
  Router,
  MapPin,
  Wifi,
  History,
  MessageSquare,
  UserPlus,
  BarChart3,
  Settings,
  FileText,
  CreditCard,
  Globe,
  Building2,
};

interface SidebarProps {
  userRole?: UserRole;
}

export function Sidebar({ userRole = "STAFF" }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = getNavItemsForRole(userRole);
  const homeHref = userRole === "SUPER_ADMIN" ? "/super-admin/dashboard" : "/dashboard";

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <Link href={homeHref} className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <Radio className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">{APP_NAME}</span>
          </Link>
        )}
        {collapsed && (
          <Link href={homeHref} className="mx-auto" onClick={() => setMobileOpen(false)}>
            <Radio className="h-6 w-6 text-primary" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "hidden rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:block",
            collapsed && "mx-auto"
          )}
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  {Icon && <Icon className="h-5 w-5 shrink-0" />}
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-border p-4">
          <p className="text-xs text-muted-foreground">
            {APP_NAME} v0.1.0
          </p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-md bg-background p-2 text-muted-foreground shadow-md md:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden h-screen flex-col border-r border-border bg-sidebar transition-all duration-300 md:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
