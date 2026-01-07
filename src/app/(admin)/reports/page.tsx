import { requireTenantId } from "@/lib/session";
import {
  Users,
  FileText,
  CreditCard,
  IndianRupee,
  HardDrive,
  Clock,
  UserX,
  Ticket,
  Router,
  Activity,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Reports",
};

const reportTypes = [
  {
    title: "Subscriber Report",
    description: "List subscribers by status, plan, area, NAS, date range",
    icon: Users,
    href: "/reports/subscribers",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Billing Report",
    description: "Invoices generated, paid, pending, overdue",
    icon: FileText,
    href: "/reports/billing",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    title: "Collection Report",
    description: "Payments received by date, method, collector",
    icon: CreditCard,
    href: "/reports/collections",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    title: "Revenue Report",
    description: "Revenue by plan, area, period",
    icon: IndianRupee,
    href: "/reports/revenue",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Usage Report",
    description: "Data consumption by subscriber, plan",
    icon: HardDrive,
    href: "/reports/usage",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    title: "Expiry Report",
    description: "Subscribers expiring in next N days",
    icon: Clock,
    href: "/reports/expiry",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    title: "Churn Report",
    description: "Subscribers who didn't renew",
    icon: UserX,
    href: "/reports/churn",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    title: "Session Report",
    description: "Login sessions with duration and usage",
    icon: Activity,
    href: "/reports/sessions",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
  {
    title: "Voucher Report",
    description: "Generated, sold, redeemed, expired vouchers",
    icon: Ticket,
    href: "/reports/vouchers",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    title: "NAS Report",
    description: "Subscribers per NAS, online count per NAS",
    icon: Router,
    href: "/reports/nas",
    color: "text-slate-600",
    bg: "bg-slate-50",
  },
];

export default async function ReportsPage() {
  await requireTenantId();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Analytics and reporting for your ISP business
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => (
          <Link
            key={report.href}
            href={report.href}
            className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-accent/50"
          >
            <div className="flex items-start gap-4">
              <div className={`rounded-lg ${report.bg} p-3`}>
                <report.icon className={`h-6 w-6 ${report.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-primary">
                  {report.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {report.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
