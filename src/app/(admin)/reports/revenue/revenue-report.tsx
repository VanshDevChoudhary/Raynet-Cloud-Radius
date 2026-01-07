"use client";

import { Suspense } from "react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ReportFilters } from "../report-filters";
import { ReportTable } from "../report-table";
import { exportToCsv, exportToExcel, printReport } from "../export-utils";

interface Props {
  report: {
    data: {
      id: string;
      invoiceNumber: string;
      subscriberName: string;
      planName: string | null;
      total: number;
      paidDate: string | null;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: {
      totalRevenue: number;
      revenueByPlan: { planName: string; totalRevenue: number; count: number }[];
    };
  };
  planOptions: { label: string; value: string }[];
}

export function RevenueReportClient({ report, planOptions }: Props) {
  const handleExportCsv = () => {
    exportToCsv(
      report.data.map((r) => ({
        "Invoice #": r.invoiceNumber,
        Subscriber: r.subscriberName,
        Plan: r.planName ?? "",
        Total: r.total,
        "Paid Date": r.paidDate ? format(new Date(r.paidDate), "dd/MM/yyyy") : "",
      })),
      "revenue-report"
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      report.data.map((r) => ({
        "Invoice #": r.invoiceNumber,
        Subscriber: r.subscriberName,
        Plan: r.planName ?? "",
        Total: r.total,
        "Paid Date": r.paidDate ? format(new Date(r.paidDate), "dd/MM/yyyy") : "",
      })),
      "revenue-report"
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Revenue Report</h1>
        <p className="text-sm text-muted-foreground">
          Total Revenue: ₹{report.summary.totalRevenue.toLocaleString()}
        </p>
      </div>

      {/* Revenue by Plan chart */}
      {report.summary.revenueByPlan.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Revenue by Plan</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.summary.revenueByPlan}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="planName" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="totalRevenue" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <ReportFilters
          showDateRange
          showPlan
          planOptions={planOptions}
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
          { header: "Amount", accessor: (row) => `₹${row.total.toLocaleString()}` },
          {
            header: "Paid Date",
            accessor: (row) => (row.paidDate ? format(new Date(row.paidDate), "dd MMM yyyy") : "-"),
          },
        ]}
        total={report.total}
        page={report.page}
        pageSize={report.pageSize}
        totalPages={report.totalPages}
      />
    </div>
  );
}
