import { requireTenantId } from "@/lib/session";
import { paymentService } from "@/services/payment.service";
import { subscriberService } from "@/services/subscriber.service";
import { PaymentTable } from "./payment-table";
import { serialize } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";

export const metadata = {
  title: "Payments",
};

export default async function PaymentsPage() {
  const tenantId = await requireTenantId();

  const [result, stats, subscribers] = await Promise.all([
    paymentService.list({ tenantId, pageSize: 100 }),
    paymentService.getStats(tenantId),
    subscriberService.list({ tenantId, pageSize: 1000 }).then((res) => res.data),
  ]);

  const statCards = [
    {
      label: "Total Payments",
      value: stats.totalPayments,
      icon: CreditCard,
      color: "text-blue-600",
    },
    {
      label: "Completed",
      value: stats.completedPayments,
      icon: CheckCircle2,
      color: "text-green-600",
    },
    {
      label: "Pending",
      value: stats.pendingPayments,
      icon: Clock,
      color: "text-orange-600",
    },
    {
      label: "Total Collected",
      value: `₹${Number(stats.totalCollected).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-purple-600",
    },
    {
      label: "This Month",
      value: `₹${Number(stats.thisMonthCollections).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-indigo-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Track and manage all payment transactions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

      <PaymentTable data={serialize(result.data)} subscribers={serialize(subscribers)} />
    </div>
  );
}
