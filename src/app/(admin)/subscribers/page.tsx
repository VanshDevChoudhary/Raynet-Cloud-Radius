import { Suspense } from "react";
import { requireTenantUser } from "@/lib/session";
import { subscriberService } from "@/services/subscriber.service";
import { planService } from "@/services/plan.service";
import { nasService } from "@/services/nas.service";
import { locationService } from "@/services/location.service";
import { SubscriberTable } from "./subscriber-table";
import { serialize } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import { hasPermission } from "@/lib/rbac";

export const metadata = {
  title: "Subscribers",
};

export default async function SubscribersPage() {
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;

  const [result, stats, plans, nasDevices, locations] = await Promise.all([
    subscriberService.list({ tenantId, pageSize: 100 }),
    subscriberService.getStats(tenantId),
    planService.listAll(tenantId),
    nasService.listAll(tenantId),
    locationService.listAll(tenantId),
  ]);

  const statCards = [
    { label: "Total", value: stats.total, icon: Users, color: "text-blue-600" },
    { label: "Active", value: stats.active, icon: UserCheck, color: "text-green-600" },
    { label: "Expired", value: stats.expired, icon: Clock, color: "text-orange-600" },
    { label: "Disabled", value: stats.disabled, icon: UserX, color: "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscribers</h1>
        <p className="text-sm text-muted-foreground">
          Manage your ISP subscribers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg bg-muted p-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Suspense>
        <SubscriberTable
          data={serialize(result.data)}
          plans={serialize(plans)}
          nasDevices={nasDevices}
          locations={locations}
          canCreate={hasPermission(user.role, "subscribers", "create")}
          canEdit={hasPermission(user.role, "subscribers", "edit")}
          canDelete={hasPermission(user.role, "subscribers", "delete")}
        />
      </Suspense>
    </div>
  );
}
