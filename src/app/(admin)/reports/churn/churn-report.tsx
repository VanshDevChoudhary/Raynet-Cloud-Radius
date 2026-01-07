"use client";

import { Suspense } from "react";
import { format } from "date-fns";
import { ReportFilters } from "../report-filters";
import { ReportTable } from "../report-table";
import { exportToCsv, exportToExcel, printReport } from "../export-utils";

interface Props {
  report: {
    data: {
      id: string;
      name: string;
      phone: string;
      username: string;
      planName: string | null;
      planPrice: number;
      locationName: string | null;
      expiryDate: string | null;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: { churnRate: string; totalChurned: number; totalActive: number };
  };
}

export function ChurnReportClient({ report }: Props) {
  const handleExportCsv = () => {
    exportToCsv(
      report.data.map((r) => ({
        Name: r.name, Phone: r.phone, Username: r.username,
        Plan: r.planName ?? "", "Plan Price": r.planPrice,
        Location: r.locationName ?? "",
        "Expiry Date": r.expiryDate ? format(new Date(r.expiryDate), "dd/MM/yyyy") : "",
      })),
      "churn-report"
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      report.data.map((r) => ({
        Name: r.name, Phone: r.phone, Username: r.username,
        Plan: r.planName ?? "", "Plan Price": r.planPrice,
        Location: r.locationName ?? "",
        "Expiry Date": r.expiryDate ? format(new Date(r.expiryDate), "dd/MM/yyyy") : "",
      })),
      "churn-report"
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Churn Report</h1>
        <p className="text-sm text-muted-foreground">Subscribers who did not renew</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Churn Rate</p>
          <p className="text-xl font-bold text-red-600">{report.summary.churnRate}%</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Churned</p>
          <p className="text-xl font-bold text-foreground">{report.summary.totalChurned}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-xl font-bold text-green-600">{report.summary.totalActive}</p>
        </div>
      </div>

      <Suspense fallback={null}>
        <ReportFilters
          showDateRange
          onExportCsv={handleExportCsv}
          onExportExcel={handleExportExcel}
          onPrint={printReport}
        />
      </Suspense>

      <ReportTable
        data={report.data}
        columns={[
          { header: "Name", accessor: "name" },
          { header: "Phone", accessor: "phone" },
          { header: "Plan", accessor: (row) => row.planName ?? "-" },
          { header: "Price", accessor: (row) => `₹${row.planPrice.toLocaleString()}` },
          { header: "Location", accessor: (row) => row.locationName ?? "-" },
          {
            header: "Expired On",
            accessor: (row) => row.expiryDate ? format(new Date(row.expiryDate), "dd MMM yyyy") : "-",
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
