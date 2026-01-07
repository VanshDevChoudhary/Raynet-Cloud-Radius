"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileSpreadsheet, Printer } from "lucide-react";

interface FilterOption {
  label: string;
  value: string;
}

interface ReportFiltersProps {
  showDateRange?: boolean;
  showStatus?: boolean;
  showPlan?: boolean;
  showLocation?: boolean;
  showNas?: boolean;
  showMethod?: boolean;
  showDaysAhead?: boolean;
  statusOptions?: FilterOption[];
  planOptions?: FilterOption[];
  locationOptions?: FilterOption[];
  nasOptions?: FilterOption[];
  methodOptions?: FilterOption[];
  onExportCsv?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
}

export function ReportFilters({
  showDateRange = true,
  showStatus,
  showPlan,
  showLocation,
  showNas,
  showMethod,
  showDaysAhead,
  statusOptions = [],
  planOptions = [],
  locationOptions = [],
  nasOptions = [],
  methodOptions = [],
  onExportCsv,
  onExportExcel,
  onPrint,
}: ReportFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read filter values directly from URL search params (source of truth)
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const status = searchParams.get("status") ?? "all";
  const planId = searchParams.get("planId") ?? "all";
  const locationId = searchParams.get("locationId") ?? "all";
  const nasDeviceId = searchParams.get("nasDeviceId") ?? "all";
  const method = searchParams.get("method") ?? "all";
  const daysAhead = searchParams.get("daysAhead") ?? "30";

  // Navigate with updated params — triggers server re-render immediately
  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );


  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        {showDateRange && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => updateFilter("startDate", e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => updateFilter("endDate", e.target.value)}
                className="w-40"
              />
            </div>
          </>
        )}

        {showDaysAhead && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Days Ahead
            </label>
            <Select value={daysAhead} onValueChange={(v) => updateFilter("daysAhead", v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {showStatus && statusOptions.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Status
            </label>
            <Select value={status} onValueChange={(v) => updateFilter("status", v)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showPlan && planOptions.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Plan
            </label>
            <Select value={planId} onValueChange={(v) => updateFilter("planId", v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {planOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showLocation && locationOptions.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Location
            </label>
            <Select value={locationId} onValueChange={(v) => updateFilter("locationId", v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locationOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showNas && nasOptions.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              NAS Device
            </label>
            <Select value={nasDeviceId} onValueChange={(v) => updateFilter("nasDeviceId", v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All NAS</SelectItem>
                {nasOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showMethod && methodOptions.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Payment Method
            </label>
            <Select value={method} onValueChange={(v) => updateFilter("method", v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {methodOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

      </div>

      {/* Export buttons */}
      <div className="flex gap-2 border-t border-border pt-3">
        {onExportCsv && (
          <Button onClick={onExportCsv} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
        )}
        {onExportExcel && (
          <Button onClick={onExportExcel} variant="outline" size="sm">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>
        )}
        {onPrint && (
          <Button onClick={onPrint} variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        )}
      </div>
    </div>
  );
}
