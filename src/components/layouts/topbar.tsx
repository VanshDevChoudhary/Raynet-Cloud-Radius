"use client";

import { Bell, LogOut, Moon, Sun, User } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import type { SessionUser } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/rbac";

interface TopbarProps {
  user: SessionUser;
}

export function Topbar({ user }: TopbarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-6">
      {/* Left side - tenant context (hidden on mobile, hamburger occupies that space) */}
      <div className="hidden items-center gap-4 md:flex">
        <h2 className="text-sm font-medium text-muted-foreground">
          {user.tenantSlug ? (
            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
              {user.tenantSlug}
            </span>
          ) : (
            <span className="rounded-md bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
              Super Admin
            </span>
          )}
        </h2>
      </div>

      {/* Right side - actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Dark mode toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          title="Toggle dark mode"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute left-2 top-2 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </button>

        {/* Notifications */}
        <button className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
        </button>

        {/* User menu */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">
              {ROLE_LABELS[user.role] || user.role.replace("_", " ")}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
