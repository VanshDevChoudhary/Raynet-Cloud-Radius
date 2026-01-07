"use client";

import { Suspense } from "react";
import { format } from "date-fns";
import { ReportFilters } from "../report-filters";
import { ReportTable } from "../report-table";
import { exportToCsv, exportToExcel, printReport, formatBytes, formatDuration } from "../export-utils";

interface SessionRow {
  id: string;
  username: string;
  nasIp: string;
  startTime: string | null;
  stopTime: string | null;
  sessionTime: number;
  inputBytes: number;
  outputBytes: number;
  framedIp: string | null;
  mac: string | null;
  terminateCause: string | null;
}

interface Props {
  report: {
    data: SessionRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: {
      totalSessions: number;
      totalUpload: number;
      totalDownload: number;
      totalSessionTime: number;
    };
  };
  nasOptions: { label: string; value: string }[];
}

export function SessionReportClient({ report, nasOptions }: Props) {
  const handleExportCsv = () => {
    exportToCsv(
      report.data.map((r) => ({
        Username: r.username, "NAS IP": r.nasIp,
        "Start Time": r.startTime ? format(new Date(r.startTime), "dd/MM/yyyy HH:mm") : "",
        "Stop Time": r.stopTime ? format(new Date(r.stopTime), "dd/MM/yyyy HH:mm") : "Online",
        Duration: formatDuration(r.sessionTime),
        Upload: formatBytes(r.inputBytes), Download: formatBytes(r.outputBytes),
        IP: r.framedIp ?? "", MAC: r.mac ?? "",
        "Terminate Cause": r.terminateCause ?? "",
      })),
      "session-report"
    );
  };

  const handleExportExcel = () => {
    exportToExcel(
      report.data.map((r) => ({
        Username: r.username, "NAS IP": r.nasIp,
        "Start Time": r.startTime ? format(new Date(r.startTime), "dd/MM/yyyy HH:mm") : "",
        "Stop Time": r.stopTime ? format(new Date(r.stopTime), "dd/MM/yyyy HH:mm") : "Online",
        Duration: formatDuration(r.sessionTime),
        Upload: formatBytes(r.inputBytes), Download: formatBytes(r.outputBytes),
        IP: r.framedIp ?? "", MAC: r.mac ?? "",
      })),
      "session-report"
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Session Report</h1>
        <p className="text-sm text-muted-foreground">{report.total} sessions found</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Sessions</p>
          <p className="text-xl font-bold">{report.summary.totalSessions.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Upload</p>
          <p className="text-xl font-bold">{formatBytes(report.summary.totalUpload)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Download</p>
          <p className="text-xl font-bold">{formatBytes(report.summary.totalDownload)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Time</p>
          <p className="text-xl font-bold">{formatDuration(report.summary.totalSessionTime)}</p>
        </div>
      </div>

      <Suspense fallback={null}>
        <ReportFilters
          showDateRange
          showNas
          nasOptions={nasOptions}
          onExportCsv={handleExportCsv}
          onExportExcel={handleExportExcel}
          onPrint={printReport}
        />
      </Suspense>

      <ReportTable
        data={report.data}
        columns={[
          { header: "Username", accessor: "username" },
          { header: "NAS IP", accessor: "nasIp" },
          {
            header: "Start",
            accessor: (row) => row.startTime ? format(new Date(row.startTime), "dd MMM HH:mm") : "-",
          },
          {
            header: "Stop",
            accessor: (row) => row.stopTime ? format(new Date(row.stopTime), "dd MMM HH:mm") : "Online",
          },
          { header: "Duration", accessor: (row) => formatDuration(row.sessionTime) },
          { header: "Upload", accessor: (row) => formatBytes(row.inputBytes) },
          { header: "Download", accessor: (row) => formatBytes(row.outputBytes) },
          { header: "IP", accessor: (row) => row.framedIp ?? "-" },
        ]}
        total={report.total}
        page={report.page}
        pageSize={report.pageSize}
        totalPages={report.totalPages}
      />
    </div>
  );
}
