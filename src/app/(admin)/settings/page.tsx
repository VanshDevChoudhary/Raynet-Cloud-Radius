import Link from "next/link";
import { requireTenantUser } from "@/lib/session";
import { hasPermission } from "@/lib/rbac";
import type { Module } from "@/lib/rbac";
import {
  Building2, CreditCard, Mail, MessageSquare, Bell,
  Users, Receipt, Radio, Globe
} from "lucide-react";

export const metadata = { title: "Settings" };

const settingsItems: {
  title: string;
  description: string;
  href: string;
  icon: typeof Building2;
  module: Module;
}[] = [
  { title: "Company Profile", description: "Name, logo, address, custom domain", href: "/settings/company", icon: Building2, module: "settings" },
  { title: "Payment Gateway", description: "Configure payment providers", href: "/settings/payment-gateway", icon: CreditCard, module: "settings" },
  { title: "SMS Gateway", description: "Configure SMS providers", href: "/settings/sms-gateway", icon: MessageSquare, module: "settings" },
  { title: "Email (SMTP)", description: "Email sending configuration", href: "/settings/email", icon: Mail, module: "settings" },
  { title: "Notification Templates", description: "Customize notification messages", href: "/settings/notifications", icon: Bell, module: "settings" },
  { title: "Users & Roles", description: "Team management and RBAC", href: "/settings/users", icon: Users, module: "users" },
  { title: "Billing Preferences", description: "Currency, tax, invoice settings", href: "/settings/billing-preferences", icon: Receipt, module: "settings" },
  { title: "RADIUS Config", description: "Server IP and ports for router setup", href: "/settings/radius", icon: Radio, module: "settings" },
  { title: "Captive Portal", description: "Customize hotspot login page", href: "/settings/captive-portal", icon: Globe, module: "settings" },
];

export default async function SettingsPage() {
  const user = await requireTenantUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your ISP account settings</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsItems
          .filter((item) => hasPermission(user.role, item.module, "view"))
          .map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-lg border border-border bg-card p-6 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
