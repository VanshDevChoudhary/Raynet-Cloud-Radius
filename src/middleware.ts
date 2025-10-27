import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const user = req.auth?.user as Record<string, unknown> | undefined;
  const userRole = user?.role as string | undefined;

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/register", "/forgot-password"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  const isApiAuth = pathname.startsWith("/api/auth");
  const isStaticAsset = pathname.startsWith("/_next") || pathname.startsWith("/favicon");
  const isPortalPath = pathname.startsWith("/portal") || pathname.startsWith("/api/portal");
  const isHotspotPath = pathname.startsWith("/hotspot") || pathname.startsWith("/api/hotspot");

  // Allow static assets, auth API, portal, and hotspot paths
  if (isStaticAsset || isApiAuth || isPortalPath || isHotspotPath) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from auth pages
  // Exception: allow /login?error=TenantSuspended so suspended users see the message
  const isSuspendedRedirect = pathname === "/login" && req.nextUrl.searchParams.get("error") === "TenantSuspended";
  if (isPublicPath && isLoggedIn && !isSuspendedRedirect) {
    if (userRole === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/super-admin/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users to login
  if (!isPublicPath && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect super-admin routes from non-super-admins
  if (pathname.startsWith("/super-admin") && userRole !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect super admin away from tenant admin pages to their dashboard
  if (
    isLoggedIn &&
    userRole === "SUPER_ADMIN" &&
    !pathname.startsWith("/super-admin") &&
    !isPublicPath
  ) {
    return NextResponse.redirect(new URL("/super-admin/dashboard", req.url));
  }

  // RBAC route protection — block pages the user's role cannot access
  // Routes are checked in order: most specific first to avoid false matches
  if (isLoggedIn && userRole) {
    const routePermissions: [string, string[]][] = [
      ["/settings/users", ["SUPER_ADMIN", "TENANT_ADMIN"]],
      ["/settings/payment-gateway", ["SUPER_ADMIN", "TENANT_ADMIN"]],
      ["/settings/sms-gateway", ["SUPER_ADMIN", "TENANT_ADMIN"]],
      ["/settings/radius", ["SUPER_ADMIN", "TENANT_ADMIN"]],
      ["/settings/captive-portal", ["SUPER_ADMIN", "TENANT_ADMIN"]],
      ["/settings", ["SUPER_ADMIN", "TENANT_ADMIN"]],
      ["/locations", ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER"]],
      ["/nas", ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER"]],
      ["/plans", ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER"]],
      ["/vouchers", ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "STAFF"]],
      ["/reports", ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER"]],
      ["/billing", ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "STAFF", "COLLECTOR"]],
      ["/subscribers", ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "STAFF", "COLLECTOR", "FRANCHISE"]],
      ["/leads", ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "STAFF"]],
      ["/complaints", ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "STAFF"]],
      ["/online-users", ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "STAFF"]],
      ["/sessions", ["SUPER_ADMIN", "TENANT_ADMIN", "MANAGER", "STAFF"]],
    ];

    for (const [route, allowedRoles] of routePermissions) {
      if (pathname.startsWith(route) && !allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  // Resolve tenant from subdomain for multi-tenant routing
  const hostname = req.headers.get("host") || "";
  const subdomain = extractSubdomain(hostname);

  const response = NextResponse.next();

  // Inject tenant context into headers for downstream use
  if (user?.tenantId) {
    response.headers.set("x-tenant-id", user.tenantId as string);
  }
  if (subdomain) {
    response.headers.set("x-tenant-slug", subdomain);
  }

  return response;
});

function extractSubdomain(hostname: string): string | null {
  if (hostname.includes("localhost") || /^\d+\.\d+\.\d+\.\d+/.test(hostname)) {
    return null;
  }

  const parts = hostname.split(".");
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
