"use client";

import { Suspense } from "react";
import { ReportFilters } from "../report-filters";
import { ReportTable } from "../report-table";
import { exportToCsv, exportToExcel, printReport, formatBytes } from "../export-utils";

interface UsageRow {
  id: string;
  name: string;
  username: string;
  planName: string | null;
  dataLimit: number | null;
  dataUnit: string | null;
  uploadBytes: number;
  downloadBytes: number;
  totalBytes: number;
  sessionCount: number;
}

interface Props {
  report: {
    data: UsageRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  planOptions: { label: string; value: string }[];
}

export function UsageReportClient({ report, planOptions }: Props) {
  const handleExportCsv = () => {
    exportToCsv(
      report.data.map((r) => ({
        Name: r.name, Username: r.username,
        Plan: r.planName ?? "",
        "Data Limit": r.dataUnit === "UNLIMITED" ? "Unlimited" : r.dataLimit ? `${r.dataLimit} ${r.dataUnit}` : "-",
        Upload: formatBytes(r.uploadBytes),
        Download: formatBytes(r.downloadBytes),
        Total: formatBytes(r.totalBytes),
        Sessions: r.sessionCount,
      })),
      "usage-report"
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      report.data.map((r) => ({
        Name: r.name, Username: r.username,
        Plan: r.planName ?? "",
        "Data Limit": r.dataUnit === "UNLIMITED" ? "Unlimited" : r.dataLimit ? `${r.dataLimit} ${r.dataUnit}` : "-",
        Upload: formatBytes(r.uploadBytes),
        Download: formatBytes(r.downloadBytes),
        Total: formatBytes(r.totalBytes),
        Sessions: r.sessionCount,
      })),
      "usage-report"
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usage Report</h1>
        <p className="text-sm text-muted-foreground">Data consumption by subscriber</p>
      </div>

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
          { header: "Name", accessor: "name" },
          { header: "Username", accessor: "username" },
          { header: "Plan", accessor: (row) => row.planName ?? "-" },
          {
            header: "Limit",
            accessor: (row) =>
              row.dataUnit === "UNLIMITED" ? "Unlimited" : row.dataLimit ? `${row.dataLimit} ${row.dataUnit}` : "-",
          },
          { header: "Upload", accessor: (row) => formatBytes(row.uploadBytes) },
          { header: "Download", accessor: (row) => formatBytes(row.downloadBytes) },
          { header: "Total", accessor: (row) => formatBytes(row.totalBytes) },
          { header: "Sessions", accessor: (row) => String(row.sessionCount) },
        ]}
        total={report.total}
        page={report.page}
        pageSize={report.pageSize}
        totalPages={report.totalPages}
      />
    </div>
  );
}
