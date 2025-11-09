"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/components/tables/sortable-header";
import { Badge } from "@/components/ui/badge";
import type { RadAcct } from "@/generated/prisma";
import { formatDistanceStrict } from "date-fns";

export const columns: ColumnDef<RadAcct>[] = [
  {
    accessorKey: "username",
    header: ({ column }) => <SortableHeader column={column} title="Username" />,
    cell: ({ row }) => {
      const username = row.original.username;
      // Remove tenant prefix for display
      const displayName = username.split("_").slice(1).join("_");
      return <span className="font-medium text-sm">{displayName}</span>;
    },
  },
  {
    accessorKey: "acctstarttime",
    header: ({ column }) => <SortableHeader column={column} title="Start Time" />,
    cell: ({ row }) => {
      const date = row.original.acctstarttime;
      return date ? (
        <span className="text-sm">
          {new Date(date).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "acctstoptime",
    header: "Stop Time",
    cell: ({ row }) => {
      const date = row.original.acctstoptime;
      return date ? (
        <span className="text-sm">
          {new Date(date).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ) : (
        <Badge variant="default" className="text-xs">
          Online
        </Badge>
      );
    },
  },
  {
    id: "duration",
    header: "Duration",
    cell: ({ row }) => {
      const sessionTimeRaw = row.original.acctsessiontime;
      if (!sessionTimeRaw) return <span className="text-muted-foreground text-sm">-</span>;
      const sessionTime = Number(sessionTimeRaw);

      const hours = Math.floor(sessionTime / 3600);
      const minutes = Math.floor((sessionTime % 3600) / 60);

      return (
        <span className="text-sm">
          {hours > 0 && `${hours}h `}
          {minutes}m
        </span>
      );
    },
  },
  {
    id: "dataUsage",
    header: "Data Usage",
    cell: ({ row }) => {
      const dataIn = Number(row.original.acctinputoctets || 0) / (1024 * 1024);
      const dataOut = Number(row.original.acctoutputoctets || 0) / (1024 * 1024);
      const total = dataIn + dataOut;

      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {total < 1024
              ? `${total.toFixed(2)} MB`
              : `${(total / 1024).toFixed(2)} GB`}
          </span>
          <span className="text-xs text-muted-foreground">
            ↓{dataIn < 1024 ? `${dataIn.toFixed(0)}M` : `${(dataIn/1024).toFixed(1)}G`} ↑{dataOut < 1024 ? `${dataOut.toFixed(0)}M` : `${(dataOut/1024).toFixed(1)}G`}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "nasipaddress",
    header: "NAS IP",
    cell: ({ row }) => (
      <code className="text-xs">{row.original.nasipaddress}</code>
    ),
  },
  {
    accessorKey: "framedipaddress",
    header: "IP Address",
    cell: ({ row }) => {
      const ip = row.original.framedipaddress;
      return ip ? (
        <code className="text-xs">{ip}</code>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "acctterminatecause",
    header: "Status",
    cell: ({ row }) => {
      const cause = row.original.acctterminatecause;
      if (!cause) return <Badge variant="outline">Unknown</Badge>;

      const variantMap: Record<string, "default" | "secondary" | "destructive"> = {
        "User-Request": "default",
        "Admin-Reset": "secondary",
        "Lost-Carrier": "destructive",
        "Idle-Timeout": "secondary",
        "Session-Timeout": "secondary",
      };

      return (
        <Badge variant={variantMap[cause] || "outline"} className="text-xs">
          {cause}
        </Badge>
      );
    },
  },
];
