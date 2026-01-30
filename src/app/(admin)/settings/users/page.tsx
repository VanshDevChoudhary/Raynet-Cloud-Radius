import { requireTenantUser } from "@/lib/session";
import { authorize } from "@/lib/rbac";
import { userService } from "@/services/user.service";
import { prisma } from "@/lib/prisma";
import { UserManagement } from "./user-management";

export const metadata = { title: "Users & Roles" };

export default async function UsersPage() {
  const user = await requireTenantUser();
  authorize(user.role, "users", "view");

  const [users, locations] = await Promise.all([
    userService.list(user.tenantId!),
    prisma.location.findMany({
      where: { tenantId: user.tenantId! },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users & Roles</h1>
        <p className="text-sm text-muted-foreground">
          Manage team members and their access levels
        </p>
      </div>
      <UserManagement
        users={JSON.parse(JSON.stringify(users))}
        locations={JSON.parse(JSON.stringify(locations))}
        currentUserRole={user.role}
      />
    </div>
  );
}
