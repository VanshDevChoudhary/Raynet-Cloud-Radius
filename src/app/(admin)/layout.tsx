import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layouts/sidebar";
import { Topbar } from "@/components/layouts/topbar";
import type { SessionUser } from "@/lib/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const sessionUser = session.user as Record<string, unknown>;

  const user: SessionUser = {
    id: (sessionUser.id as string) ?? "",
    name: (sessionUser.name as string) ?? "",
    email: (sessionUser.email as string) ?? "",
    role: (sessionUser.role as SessionUser["role"]) ?? "STAFF",
    tenantId: (sessionUser.tenantId as string) ?? null,
    tenantSlug: (sessionUser.tenantSlug as string) ?? null,
  };

  // Super admins should use the super-admin route group
  if (user.role === "SUPER_ADMIN") {
    redirect("/super-admin/dashboard");
  }

  // Block suspended/inactive tenants at the layout level
  if (user.tenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { status: true },
    });
    if (tenant && !["ACTIVE", "TRIAL"].includes(tenant.status)) {
      redirect("/login?error=TenantSuspended");
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole={user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 pt-16 sm:p-6 sm:pt-6 md:pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
