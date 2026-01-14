"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface PortalInvoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  total: number;
  balanceDue: number;
  status: string;
  invoiceDate: string;
  dueDate: string;
  planName: string | null;
}

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  ISSUED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-100 text-slate-800",
};

export function PortalBillingClient({
  invoices,
}: {
  invoices: {
    data: PortalInvoice[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}) {
  if (invoices.data.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Billing</h2>
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
          No invoices found
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Billing</h2>

      <div className="space-y-3">
        {invoices.data.map((invoice) => (
          <div
            key={invoice.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground">
                  {invoice.invoiceNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  {invoice.planName ?? "N/A"}
                </p>
              </div>
              <Badge
                className={statusColor[invoice.status] ?? ""}
                variant="outline"
              >
                {invoice.status}
              </Badge>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <div>
                <p className="text-muted-foreground">
                  {format(new Date(invoice.invoiceDate), "dd MMM yyyy")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">
                  ₹{invoice.total.toLocaleString()}
                </p>
                {invoice.balanceDue > 0 && (
                  <p className="text-xs text-red-600">
                    Due: ₹{invoice.balanceDue.toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
