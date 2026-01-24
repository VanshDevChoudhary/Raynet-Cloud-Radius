import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layouts/sidebar";
import { Topbar } from "@/components/layouts/topbar";
import type { SessionUser } from "@/lib/types";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sessionUser = session.user as Record<string, unknown>;
  const user: SessionUser = {
    id: (sessionUser.id as string) ?? "",
    name: (sessionUser.name as string) ?? "",
    email: (sessionUser.email as string) ?? "",
    role: (sessionUser.role as SessionUser["role"]) ?? "STAFF",
    tenantId: (sessionUser.tenantId as string) ?? null,
    tenantSlug: (sessionUser.tenantSlug as string) ?? null,
  };

  // Only SUPER_ADMIN can access these pages
  if (user.role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole={user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
