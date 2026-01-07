"use client";

import { Badge } from "@/components/ui/badge";
import { exportToCsv, exportToExcel, printReport } from "../export-utils";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Printer } from "lucide-react";

interface NasRow {
  id: string;
  name: string;
  nasIp: string;
  nasType: string;
  status: string;
  locationName: string | null;
  subscriberCount: number;
}

interface Props {
  report: {
    data: NasRow[];
    total: number;
  };
}

export function NasReportClient({ report }: Props) {
  const handleExportCsv = () => {
    exportToCsv(
      report.data.map((r) => ({
        Name: r.name, "NAS IP": r.nasIp, Type: r.nasType,
        Status: r.status, Location: r.locationName ?? "",
        Subscribers: r.subscriberCount,
      })),
      "nas-report"
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      report.data.map((r) => ({
        Name: r.name, "NAS IP": r.nasIp, Type: r.nasType,
        Status: r.status, Location: r.locationName ?? "",
        Subscribers: r.subscriberCount,
      })),
      "nas-report"
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">NAS Report</h1>
        <p className="text-sm text-muted-foreground">{report.total} NAS devices</p>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleExportCsv} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />CSV
        </Button>
        <Button onClick={handleExportExcel} variant="outline" size="sm">
          <FileSpreadsheet className="mr-2 h-4 w-4" />Excel
        </Button>
        <Button onClick={printReport} variant="outline" size="sm">
          <Printer className="mr-2 h-4 w-4" />Print
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">NAS IP</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subscribers</th>
            </tr>
          </thead>
          <tbody>
            {report.data.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3 font-mono text-sm">{row.nasIp}</td>
                <td className="px-4 py-3">{row.nasType}</td>
                <td className="px-4 py-3">
                  <Badge
                    className={row.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    variant="outline"
                  >
                    {row.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">{row.locationName ?? "-"}</td>
                <td className="px-4 py-3 font-bold">{row.subscriberCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
