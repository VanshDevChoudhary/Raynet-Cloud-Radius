"use client";

import { Suspense } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ReportFilters } from "../report-filters";
import { ReportTable } from "../report-table";
import { exportToCsv, exportToExcel, printReport } from "../export-utils";

interface SubscriberRow {
  id: string;
  name: string;
  phone: string;
  username: string;
  status: string;
  planName: string | null;
  locationName: string | null;
  nasName: string | null;
  expiryDate: string | null;
  createdAt: string;
}

interface Props {
  report: {
    data: SubscriberRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  planOptions: { label: string; value: string }[];
  locationOptions: { label: string; value: string }[];
  nasOptions: { label: string; value: string }[];
}

const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  EXPIRED: "bg-red-100 text-red-800",
  DISABLED: "bg-gray-100 text-gray-800",
  SUSPENDED: "bg-amber-100 text-amber-800",
  TRIAL: "bg-blue-100 text-blue-800",
};

export function SubscriberReportClient({ report, planOptions, locationOptions, nasOptions }: Props) {
  const handleExportCsv = () => {
    exportToCsv(
      report.data.map((r) => ({
        Name: r.name,
        Phone: r.phone,
        Username: r.username,
        Status: r.status,
        Plan: r.planName ?? "",
        Location: r.locationName ?? "",
        NAS: r.nasName ?? "",
        "Expiry Date": r.expiryDate ? format(new Date(r.expiryDate), "dd/MM/yyyy") : "",
        "Joined": format(new Date(r.createdAt), "dd/MM/yyyy"),
      })),
      "subscriber-report"
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      report.data.map((r) => ({
        Name: r.name,
        Phone: r.phone,
        Username: r.username,
        Status: r.status,
        Plan: r.planName ?? "",
        Location: r.locationName ?? "",
        NAS: r.nasName ?? "",
        "Expiry Date": r.expiryDate ? format(new Date(r.expiryDate), "dd/MM/yyyy") : "",
        "Joined": format(new Date(r.createdAt), "dd/MM/yyyy"),
      })),
      "subscriber-report"
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscriber Report</h1>
        <p className="text-sm text-muted-foreground">
          {report.total} subscribers found
        </p>
      </div>

      <Suspense fallback={null}>
        <ReportFilters
          showDateRange
          showStatus
          showPlan
          showLocation
          showNas
          statusOptions={[
            { label: "Active", value: "ACTIVE" },
            { label: "Expired", value: "EXPIRED" },
            { label: "Disabled", value: "DISABLED" },
            { label: "Suspended", value: "SUSPENDED" },
            { label: "Trial", value: "TRIAL" },
          ]}
          planOptions={planOptions}
          locationOptions={locationOptions}
          nasOptions={nasOptions}
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
          {
            header: "Status",
            accessor: (row) => (
              <Badge className={statusColor[row.status] ?? ""} variant="outline">
                {row.status}
              </Badge>
            ),
          },
          { header: "Plan", accessor: (row) => row.planName ?? "-" },
          { header: "Location", accessor: (row) => row.locationName ?? "-" },
          {
            header: "Expiry",
            accessor: (row) =>
              row.expiryDate ? format(new Date(row.expiryDate), "dd MMM yyyy") : "-",
          },
          {
            header: "Joined",
            accessor: (row) => format(new Date(row.createdAt), "dd MMM yyyy"),
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
