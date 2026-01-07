"use client";

import { Suspense } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ReportFilters } from "../report-filters";
import { ReportTable } from "../report-table";
import { exportToCsv, exportToExcel, printReport } from "../export-utils";

interface BillingRow {
  id: string;
  invoiceNumber: string;
  subscriberName: string;
  planName: string | null;
  amount: number;
  tax: number;
  total: number;
  balanceDue: number;
  status: string;
  invoiceDate: string;
  dueDate: string;
}

interface Props {
  report: {
    data: BillingRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: {
      totalInvoiced: number;
      totalPaid: number;
      totalOutstanding: number;
      count: number;
    };
  };
}

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  ISSUED: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  OVERDUE: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-100 text-slate-800",
};

export function BillingReportClient({ report }: Props) {
  const handleExportCsv = () => {
    exportToCsv(
      report.data.map((r) => ({
        "Invoice #": r.invoiceNumber,
        Subscriber: r.subscriberName,
        Plan: r.planName ?? "",
        Amount: r.amount,
        Tax: r.tax,
        Total: r.total,
        "Balance Due": r.balanceDue,
        Status: r.status,
        "Invoice Date": format(new Date(r.invoiceDate), "dd/MM/yyyy"),
        "Due Date": format(new Date(r.dueDate), "dd/MM/yyyy"),
      })),
      "billing-report"
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      report.data.map((r) => ({
        "Invoice #": r.invoiceNumber,
        Subscriber: r.subscriberName,
        Plan: r.planName ?? "",
        Amount: r.amount,
        Tax: r.tax,
        Total: r.total,
        "Balance Due": r.balanceDue,
        Status: r.status,
        "Invoice Date": format(new Date(r.invoiceDate), "dd/MM/yyyy"),
        "Due Date": format(new Date(r.dueDate), "dd/MM/yyyy"),
      })),
      "billing-report"
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing Report</h1>
        <p className="text-sm text-muted-foreground">{report.total} invoices found</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Invoiced</p>
          <p className="text-xl font-bold text-foreground">₹{report.summary.totalInvoiced.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Paid</p>
          <p className="text-xl font-bold text-green-600">₹{report.summary.totalPaid.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="text-xl font-bold text-red-600">₹{report.summary.totalOutstanding.toLocaleString()}</p>
        </div>
      </div>

      <Suspense fallback={null}>
        <ReportFilters
          showDateRange
          showStatus
          statusOptions={[
            { label: "Draft", value: "DRAFT" },
            { label: "Issued", value: "ISSUED" },
            { label: "Paid", value: "PAID" },
            { label: "Overdue", value: "OVERDUE" },
            { label: "Cancelled", value: "CANCELLED" },
          ]}
          onExportCsv={handleExportCsv}
          onExportExcel={handleExportExcel}
          onPrint={printReport}
        />
      </Suspense>

      <ReportTable
        data={report.data}
        columns={[
          { header: "Invoice #", accessor: "invoiceNumber" },
          { header: "Subscriber", accessor: "subscriberName" },
          { header: "Plan", accessor: (row) => row.planName ?? "-" },
          { header: "Total", accessor: (row) => `₹${row.total.toLocaleString()}` },
          { header: "Balance Due", accessor: (row) => `₹${row.balanceDue.toLocaleString()}` },
          {
            header: "Status",
            accessor: (row) => (
              <Badge className={statusColor[row.status] ?? ""} variant="outline">
                {row.status}
              </Badge>
            ),
          },
          { header: "Date", accessor: (row) => format(new Date(row.invoiceDate), "dd MMM yyyy") },
          { header: "Due", accessor: (row) => format(new Date(row.dueDate), "dd MMM yyyy") },
        ]}
        total={report.total}
        page={report.page}
        pageSize={report.pageSize}
        totalPages={report.totalPages}
      />
    </div>
  );
}
