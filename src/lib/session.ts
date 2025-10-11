import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/lib/types";
import { authorize, type Module, type Action } from "@/lib/rbac";

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;

  const u = session.user as Record<string, unknown>;
  return {
    id: (u.id as string) ?? "",
    name: (u.name as string) ?? "",
    email: (u.email as string) ?? "",
    role: (u.role as SessionUser["role"]) ?? "STAFF",
    tenantId: (u.tenantId as string) ?? null,
    tenantSlug: (u.tenantSlug as string) ?? null,
  };
}

export async function requireTenantUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  if (!user.tenantId && user.role !== "SUPER_ADMIN") {
    throw new Error("No tenant context");
  }

  // Check tenant is still active (catches mid-session suspensions)
  if (user.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { status: true },
    });
    if (tenant && !["ACTIVE", "TRIAL"].includes(tenant.status)) {
      redirect("/login?error=TenantSuspended");
    }
  }

  return user;
}

export async function requireTenantId(): Promise<string> {
  const user = await requireTenantUser();
  if (!user.tenantId) throw new Error("No tenant context");
  return user.tenantId;
}

export async function requireAuthorized(
  module: Module,
  action: Action
): Promise<{ user: SessionUser; tenantId: string }> {
  const user = await requireTenantUser();
  authorize(user.role, module, action);
  if (!user.tenantId) throw new Error("No tenant context");
  return { user, tenantId: user.tenantId };
}
