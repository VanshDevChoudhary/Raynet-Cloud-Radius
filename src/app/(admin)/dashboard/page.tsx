import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserX,
  IndianRupee,
  Wifi,
  TrendingUp,
  UserPlus,
  AlertCircle,
  Plus,
  CreditCard,
} from "lucide-react";
import { requireTenantUser } from "@/lib/session";
import { dashboardService } from "@/services/dashboard.service";
import {
  SubscriberGrowthChart,
  RevenueTrendChart,
  PlanDistributionChart,
  AreaDistributionChart,
} from "./dashboard-charts";
import { RecentActivityFeed } from "./recent-activity";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await requireTenantUser();
  if (!user.tenantId) redirect("/login");

  const [stats, subscriberGrowth, revenueTrend, planDistribution, areaDistribution, recentActivity] =
    await Promise.all([
      dashboardService.getStats(user.tenantId),
      dashboardService.getSubscriberGrowth(user.tenantId),
      dashboardService.getRevenueTrend(user.tenantId),
      dashboardService.getPlanDistribution(user.tenantId),
      dashboardService.getAreaDistribution(user.tenantId),
      dashboardService.getRecentActivity(user.tenantId),
    ]);

  const statCards = [
    {
      title: "Total Subscribers",
      value: stats.totalSubscribers.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Active",
      value: stats.activeSubscribers.toLocaleString(),
      icon: UserCheck,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Expired",
      value: stats.expiredSubscribers.toLocaleString(),
      icon: UserX,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      title: "New This Month",
      value: stats.newThisMonth.toLocaleString(),
      icon: UserPlus,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "MRR",
      value: `₹${stats.mrr.toLocaleString()}`,
      icon: IndianRupee,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Collections (Month)",
      value: `₹${stats.collectionsThisMonth.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Outstanding",
      value: `₹${stats.outstandingAmount.toLocaleString()}`,
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Online Now",
      value: stats.onlineNow.toLocaleString(),
      icon: Wifi,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with quick actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {user.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/subscribers?action=create"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:px-4"
            title="Add Subscriber"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Subscriber</span>
          </Link>
          <Link
            href="/billing/payments?action=record"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-accent sm:px-4"
            title="Record Payment"
          >
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Record Payment</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="rounded-lg border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </p>
              <div className={`rounded-md ${stat.bg} p-2`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row 1: Growth + Revenue */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SubscriberGrowthChart data={subscriberGrowth} />
        <RevenueTrendChart data={revenueTrend} />
      </div>

      {/* Charts Row 2: Plan Distribution + Area Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PlanDistributionChart data={planDistribution} />
        <AreaDistributionChart data={areaDistribution} />
      </div>

      {/* Recent Activity */}
      <RecentActivityFeed activities={JSON.parse(JSON.stringify(recentActivity))} />
    </div>
  );
}
