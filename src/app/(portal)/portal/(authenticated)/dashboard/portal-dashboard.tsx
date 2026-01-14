"use client";

import { format } from "date-fns";
import { Wifi, HardDrive, Calendar, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PortalSubscriber {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  username: string;
  status: string;
  planName: string | null;
  planSpeed: string | null;
  dataLimit: string | null;
  expiryDate: string | null;
  balance: number;
}

interface UsageData {
  totalUpload: number;
  totalDownload: number;
  totalBytes: number;
  sessionCount: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  EXPIRED: "bg-red-100 text-red-800",
  DISABLED: "bg-gray-100 text-gray-800",
  SUSPENDED: "bg-amber-100 text-amber-800",
};

export function PortalDashboardClient({
  profile,
  usage,
}: {
  profile: PortalSubscriber;
  usage: UsageData;
}) {
  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-foreground">
              Hi, {profile.name}
            </p>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>
          <Badge className={statusColor[profile.status] ?? ""} variant="outline">
            {profile.status}
          </Badge>
        </div>
      </div>

      {/* Plan Info */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold text-foreground">Current Plan</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Plan</p>
              <p className="text-sm font-medium">{profile.planName ?? "No Plan"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Speed</p>
              <p className="text-sm font-medium">{profile.planSpeed ?? "-"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">Data Limit</p>
              <p className="text-sm font-medium">{profile.dataLimit ?? "-"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Expires</p>
              <p className="text-sm font-medium">
                {profile.expiryDate
                  ? format(new Date(profile.expiryDate), "dd MMM yyyy")
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 font-semibold text-foreground">Data Usage</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-blue-600">
              {formatBytes(usage.totalUpload)}
            </p>
            <p className="text-xs text-muted-foreground">Upload</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">
              {formatBytes(usage.totalDownload)}
            </p>
            <p className="text-xs text-muted-foreground">Download</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">
              {formatBytes(usage.totalBytes)}
            </p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      </div>

      {/* Balance */}
      {profile.balance !== 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-xs text-muted-foreground">Account Balance</p>
              <p className="text-lg font-bold text-foreground">
                ₹{profile.balance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
