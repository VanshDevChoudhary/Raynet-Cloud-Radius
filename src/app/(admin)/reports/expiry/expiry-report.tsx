"use client";

import { Suspense } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ReportFilters } from "../report-filters";
import { ReportTable } from "../report-table";
import { exportToCsv, exportToExcel, printReport } from "../export-utils";

interface ExpiryRow {
  id: string;
  name: string;
  phone: string;
  username: string;
  planName: string | null;
  expiryDate: string | null;
  daysUntilExpiry: number;
}

interface Props {
  report: {
    data: ExpiryRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function ExpiryReportClient({ report }: Props) {
  const handleExportCsv = () => {
    exportToCsv(
      report.data.map((r) => ({
        Name: r.name,
        Phone: r.phone,
        Username: r.username,
        Plan: r.planName ?? "",
        "Expiry Date": r.expiryDate ? format(new Date(r.expiryDate), "dd/MM/yyyy") : "",
        "Days Left": r.daysUntilExpiry,
      })),
      "expiry-report"
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      report.data.map((r) => ({
        Name: r.name,
        Phone: r.phone,
        Username: r.username,
        Plan: r.planName ?? "",
        "Expiry Date": r.expiryDate ? format(new Date(r.expiryDate), "dd/MM/yyyy") : "",
        "Days Left": r.daysUntilExpiry,
      })),
      "expiry-report"
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Expiry Report</h1>
        <p className="text-sm text-muted-foreground">
          {report.total} subscribers expiring soon
        </p>
      </div>

      <Suspense fallback={null}>
        <ReportFilters
          showDateRange={false}
          showDaysAhead
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
          { header: "Username", accessor: "username" },
          { header: "Plan", accessor: (row) => row.planName ?? "-" },
          {
            header: "Expiry Date",
            accessor: (row) =>
              row.expiryDate ? format(new Date(row.expiryDate), "dd MMM yyyy") : "-",
          },
          {
            header: "Days Left",
            accessor: (row) => (
              <Badge
                className={
                  row.daysUntilExpiry <= 3
                    ? "bg-red-100 text-red-800"
                    : row.daysUntilExpiry <= 7
                    ? "bg-amber-100 text-amber-800"
                    : "bg-green-100 text-green-800"
                }
                variant="outline"
              >
                {row.daysUntilExpiry} days
              </Badge>
            ),
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
