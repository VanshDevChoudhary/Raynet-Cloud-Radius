"use client";

import { Suspense } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ReportFilters } from "../report-filters";
import { ReportTable } from "../report-table";
import { exportToCsv, exportToExcel, printReport } from "../export-utils";

interface Props {
  report: {
    data: {
      id: string;
      code: string;
      status: string;
      batchName: string;
      planName: string | null;
      planPrice: number;
      createdAt: string;
      redeemedAt: string | null;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: { generated: number; sold: number; redeemed: number; expired: number };
  };
}

const statusColor: Record<string, string> = {
  GENERATED: "bg-blue-100 text-blue-800",
  SOLD: "bg-amber-100 text-amber-800",
  REDEEMED: "bg-green-100 text-green-800",
  EXPIRED: "bg-red-100 text-red-800",
};

export function VoucherReportClient({ report }: Props) {
  const handleExportCsv = () => {
    exportToCsv(
      report.data.map((r) => ({
        Code: r.code, Status: r.status, Batch: r.batchName,
        Plan: r.planName ?? "", Price: r.planPrice,
        Created: format(new Date(r.createdAt), "dd/MM/yyyy"),
        Redeemed: r.redeemedAt ? format(new Date(r.redeemedAt), "dd/MM/yyyy") : "",
      })),
      "voucher-report"
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      report.data.map((r) => ({
        Code: r.code, Status: r.status, Batch: r.batchName,
        Plan: r.planName ?? "", Price: r.planPrice,
        Created: format(new Date(r.createdAt), "dd/MM/yyyy"),
        Redeemed: r.redeemedAt ? format(new Date(r.redeemedAt), "dd/MM/yyyy") : "",
      })),
      "voucher-report"
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Voucher Report</h1>
        <p className="text-sm text-muted-foreground">{report.total} vouchers total</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Generated</p>
          <p className="text-xl font-bold text-blue-600">{report.summary.generated}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Sold</p>
          <p className="text-xl font-bold text-amber-600">{report.summary.sold}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Redeemed</p>
          <p className="text-xl font-bold text-green-600">{report.summary.redeemed}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Expired</p>
          <p className="text-xl font-bold text-red-600">{report.summary.expired}</p>
        </div>
      </div>

      <Suspense fallback={null}>
        <ReportFilters
          showDateRange={false}
          showStatus
          statusOptions={[
            { label: "Generated", value: "GENERATED" },
            { label: "Sold", value: "SOLD" },
            { label: "Redeemed", value: "REDEEMED" },
            { label: "Expired", value: "EXPIRED" },
          ]}
          onExportCsv={handleExportCsv}
          onExportExcel={handleExportExcel}
          onPrint={printReport}
        />
      </Suspense>

      <ReportTable
        data={report.data}
        columns={[
          { header: "Code", accessor: "code" },
          {
            header: "Status",
            accessor: (row) => (
              <Badge className={statusColor[row.status] ?? ""} variant="outline">{row.status}</Badge>
            ),
          },
          { header: "Batch", accessor: "batchName" },
          { header: "Plan", accessor: (row) => row.planName ?? "-" },
          { header: "Price", accessor: (row) => `₹${row.planPrice.toLocaleString()}` },
          { header: "Created", accessor: (row) => format(new Date(row.createdAt), "dd MMM yyyy") },
          {
            header: "Redeemed",
            accessor: (row) => row.redeemedAt ? format(new Date(row.redeemedAt), "dd MMM yyyy") : "-",
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
