import { tenantService } from "@/services/tenant.service";
import { Building2, Users, UserCheck, AlertTriangle, Clock, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Platform Dashboard" };

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
    case "TRIAL":
      return <Badge variant="secondary">Trial</Badge>;
    case "SUSPENDED":
      return <Badge variant="destructive">Suspended</Badge>;
    case "INACTIVE":
      return <Badge variant="outline">Inactive</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function TierBadge({ tier }: { tier: string }) {
  switch (tier) {
    case "STARTER":
      return <Badge variant="outline">Starter</Badge>;
    case "GROWTH":
      return <Badge variant="secondary">Growth</Badge>;
    case "PROFESSIONAL":
      return <Badge>Professional</Badge>;
    case "ENTERPRISE":
      return <Badge className="bg-purple-600 text-white hover:bg-purple-700">Enterprise</Badge>;
    default:
      return <Badge variant="outline">{tier}</Badge>;
  }
}

export default async function SuperAdminDashboard() {
  const stats = await tenantService.getPlatformStats();

  const statCards = [
    {
      title: "Total Tenants",
      value: stats.totalTenants,
      icon: Building2,
      description: "All registered ISP operators",
    },
    {
      title: "Active Tenants",
      value: stats.activeTenants,
      icon: UserCheck,
      description: "Currently active accounts",
    },
    {
      title: "Trial Tenants",
      value: stats.trialTenants,
      icon: Clock,
      description: "On trial period",
    },
    {
      title: "Suspended",
      value: stats.suspendedTenants,
      icon: AlertTriangle,
      description: "Suspended accounts",
    },
    {
      title: "Total Subscribers",
      value: stats.totalSubscribers,
      icon: Users,
      description: "Across all tenants",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Shield,
      description: "Staff accounts across tenants",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of all ISP operators on the platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Tenants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentTenants.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No tenants yet. Create your first tenant from the Tenants page.
            </p>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Slug
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Tier
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {stats.recentTenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 align-middle font-medium">{tenant.name}</td>
                      <td className="p-4 align-middle">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {tenant.slug}
                        </code>
                      </td>
                      <td className="p-4 align-middle">
                        <StatusBadge status={tenant.status} />
                      </td>
                      <td className="p-4 align-middle">
                        <TierBadge tier={tenant.planTier} />
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">
                        {formatDate(tenant.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
