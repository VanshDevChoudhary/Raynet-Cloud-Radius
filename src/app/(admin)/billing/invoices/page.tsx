import { requireTenantId } from "@/lib/session";
import { billingService } from "@/services/billing.service";
import { prisma } from "@/lib/prisma";
import { InvoiceTable } from "./invoice-table";
import { serialize } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  TrendingUp,
} from "lucide-react";

export const metadata = {
  title: "Invoices",
};

export default async function InvoicesPage() {
  const tenantId = await requireTenantId();

  const [result, stats, subscribers] = await Promise.all([
    billingService.list({ tenantId, pageSize: 100 }),
    billingService.getStats(tenantId),
    prisma.subscriber.findMany({
      where: { tenantId },
      select: { id: true, name: true, phone: true, username: true, email: true, planId: true, status: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const statCards = [
    {
      label: "Total Invoices",
      value: stats.totalInvoices,
      icon: FileText,
      color: "text-blue-600",
    },
    {
      label: "Paid",
      value: stats.paidInvoices,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      label: "Pending",
      value: stats.pendingInvoices,
      icon: Clock,
      color: "text-orange-600",
    },
    {
      label: "Overdue",
      value: stats.overdueInvoices,
      icon: AlertCircle,
      color: "text-red-600",
    },
    {
      label: "Total Revenue",
      value: `₹${Number(stats.totalRevenue).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-purple-600",
    },
    {
      label: "This Month",
      value: `₹${Number(stats.thisMonthRevenue).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-indigo-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Manage invoices and track revenue
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-lg bg-muted p-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <InvoiceTable data={serialize(result.data)} subscribers={serialize(subscribers)} />
    </div>
  );
}
