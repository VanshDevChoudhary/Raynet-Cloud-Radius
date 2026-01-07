"use client";

import { Suspense } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ReportFilters } from "../report-filters";
import { ReportTable } from "../report-table";
import { exportToCsv, exportToExcel, printReport } from "../export-utils";

interface CollectionRow {
  id: string;
  subscriberName: string;
  amount: number;
  method: string;
  transactionId: string | null;
  status: string;
  createdAt: string;
}

interface Props {
  report: {
    data: CollectionRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: {
      totalCollected: number;
      count: number;
      byMethod: { method: string; amount: number; count: number }[];
    };
  };
}

export function CollectionReportClient({ report }: Props) {
  const handleExportCsv = () => {
    exportToCsv(
      report.data.map((r) => ({
        Subscriber: r.subscriberName,
        Amount: r.amount,
        Method: r.method,
        "Transaction ID": r.transactionId ?? "",
        Status: r.status,
        Date: format(new Date(r.createdAt), "dd/MM/yyyy"),
      })),
      "collection-report"
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      report.data.map((r) => ({
        Subscriber: r.subscriberName,
        Amount: r.amount,
        Method: r.method,
        "Transaction ID": r.transactionId ?? "",
        Status: r.status,
        Date: format(new Date(r.createdAt), "dd/MM/yyyy"),
      })),
      "collection-report"
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Collection Report</h1>
        <p className="text-sm text-muted-foreground">{report.total} payments found</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Collected</p>
          <p className="text-xl font-bold text-green-600">₹{report.summary.totalCollected.toLocaleString()}</p>
        </div>
        {report.summary.byMethod.map((m) => (
          <div key={m.method} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{m.method}</p>
            <p className="text-lg font-bold text-foreground">₹{m.amount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{m.count} payments</p>
          </div>
        ))}
      </div>

      <Suspense fallback={null}>
        <ReportFilters
          showDateRange
          showMethod
          showStatus
          methodOptions={[
            { label: "Cash", value: "CASH" },
            { label: "UPI", value: "UPI" },
            { label: "Card", value: "CARD" },
            { label: "Bank Transfer", value: "BANK_TRANSFER" },
            { label: "Payment Gateway", value: "PAYMENT_GATEWAY" },
          ]}
          statusOptions={[
            { label: "Completed", value: "COMPLETED" },
            { label: "Pending", value: "PENDING" },
            { label: "Failed", value: "FAILED" },
          ]}
          onExportCsv={handleExportCsv}
          onExportExcel={handleExportExcel}
          onPrint={printReport}
        />
      </Suspense>

      <ReportTable
        data={report.data}
        columns={[
          { header: "Subscriber", accessor: "subscriberName" },
          { header: "Amount", accessor: (row) => `₹${row.amount.toLocaleString()}` },
          {
            header: "Method",
            accessor: (row) => (
              <Badge variant="outline">{row.method.replace("_", " ")}</Badge>
            ),
          },
          { header: "Transaction ID", accessor: (row) => row.transactionId ?? "-" },
          {
            header: "Status",
            accessor: (row) => (
              <Badge
                className={
                  row.status === "COMPLETED"
                    ? "bg-green-100 text-green-800"
                    : row.status === "FAILED"
                    ? "bg-red-100 text-red-800"
                    : "bg-amber-100 text-amber-800"
                }
                variant="outline"
              >
                {row.status}
              </Badge>
            ),
          },
          { header: "Date", accessor: (row) => format(new Date(row.createdAt), "dd MMM yyyy") },
        ]}
        total={report.total}
        page={report.page}
        pageSize={report.pageSize}
        totalPages={report.totalPages}
      />
    </div>
  );
}
