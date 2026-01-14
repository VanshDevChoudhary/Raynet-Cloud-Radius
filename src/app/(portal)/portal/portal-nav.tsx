"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, MessageSquare, User, LogOut, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navItems = [
  { title: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { title: "Billing", href: "/portal/billing", icon: FileText },
  { title: "Complaints", href: "/portal/complaints", icon: MessageSquare },
  { title: "Profile", href: "/portal/profile", icon: User },
];

export function PortalNav({ subscriberName }: { subscriberName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/portal/logout", { method: "POST" });
    toast.success("Logged out");
    router.push("/portal/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link href="/portal/dashboard" className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">My Portal</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {subscriberName}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bottom navigation - mobile first */}
      <nav className="border-t border-border">
        <div className="mx-auto flex max-w-lg">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
