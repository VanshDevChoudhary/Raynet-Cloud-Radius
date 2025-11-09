"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { SortableHeader } from "@/components/tables/sortable-header";
import { Badge } from "@/components/ui/badge";
import type { RadAcct } from "@/generated/prisma";
import { formatDistanceToNow } from "date-fns";

export const columns: ColumnDef<RadAcct>[] = [
  {
    accessorKey: "username",
    header: ({ column }) => <SortableHeader column={column} title="Username" />,
    cell: ({ row }) => {
      const username = row.original.username;
      // Remove tenant prefix for display
      const displayName = username.split("_").slice(1).join("_");
      return <span className="font-medium">{displayName}</span>;
    },
  },
  {
    accessorKey: "framedipaddress",
    header: "IP Address",
    cell: ({ row }) => {
      const ip = row.original.framedipaddress;
      return ip || <span className="text-muted-foreground">-</span>;
    },
  },
  {
    accessorKey: "callingstationid",
    header: "MAC Address",
    cell: ({ row }) => {
      const mac = row.original.callingstationid;
      return mac ? (
        <code className="text-xs">{mac}</code>
      ) : (
        <span className="text-muted-foreground">-</span>
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
    accessorKey: "acctstarttime",
    header: ({ column }) => <SortableHeader column={column} title="Session Start" />,
    cell: ({ row }) => {
      const date = row.original.acctstarttime;
      return date ? (
        <div className="flex flex-col">
          <span className="text-sm">
            {new Date(date).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(date), { addSuffix: true })}
          </span>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
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
            ↓ {dataIn.toFixed(1)} MB / ↑ {dataOut.toFixed(1)} MB
          </span>
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    cell: () => <Badge variant="default">Online</Badge>,
  },
];
