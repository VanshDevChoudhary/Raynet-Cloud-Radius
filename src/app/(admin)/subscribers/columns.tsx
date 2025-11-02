"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Subscriber, Plan, NasDevice, Location } from "@/generated/prisma";
import type { Serialized } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Eye, UserCheck, UserX, Clock, Ban } from "lucide-react";
import { SortableHeader } from "@/components/tables/sortable-header";
import Link from "next/link";
import { format } from "date-fns";

type SubscriberWithRelations = Serialized<Subscriber & {
  plan: Pick<Plan, "id" | "name" | "downloadSpeed" | "uploadSpeed" | "speedUnit"> | null;
  nasDevice: Pick<NasDevice, "id" | "name" | "nasIp"> | null;
  location: Pick<Location, "id" | "name" | "type"> | null;
}>;

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  EXPIRED: "destructive",
  DISABLED: "secondary",
  SUSPENDED: "outline",
  TRIAL: "outline",
};

const statusClassName: Record<string, string> = {
  SUSPENDED: "border-amber-500 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

interface SubscriberColumnsProps {
  onEdit?: (subscriber: SubscriberWithRelations) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
}

export function getSubscriberColumns({
  onEdit,
  onDelete,
  onStatusChange,
}: SubscriberColumnsProps): ColumnDef<SubscriberWithRelations>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div>
          <Link
            href={`/subscribers/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
          <p className="text-xs text-muted-foreground">{row.original.username}</p>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <span className="text-sm">{row.original.phone}</span>,
    },
    {
      accessorKey: "plan",
      header: "Plan",
      cell: ({ row }) =>
        row.original.plan ? (
          <div>
            <p className="text-sm font-medium">{row.original.plan.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.plan.downloadSpeed}/{row.original.plan.uploadSpeed}{" "}
              {row.original.plan.speedUnit}
            </p>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No plan</span>
        ),
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) =>
        row.original.location?.name ?? (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: "expiryDate",
      header: ({ column }) => <SortableHeader column={column} title="Expiry" />,
      cell: ({ row }) => {
        const date = row.original.expiryDate;
        if (!date) return <span className="text-muted-foreground">-</span>;
        const isExpired = new Date(date) < new Date();
        return (
          <span className={isExpired ? "text-destructive" : "text-sm"}>
            {format(new Date(date), "dd MMM yyyy")}
          </span>
        );
      },
    },
    {
      accessorKey: "connectionType",
      header: "Conn.",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.connectionType}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <Badge
          variant={statusVariant[row.original.status] ?? "secondary"}
          className={statusClassName[row.original.status] ?? ""}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/subscribers/${row.original.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View Profile
              </Link>
            </DropdownMenuItem>
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(row.original)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
            )}
            {onStatusChange && (
              <>
                <DropdownMenuSeparator />
                {row.original.status !== "ACTIVE" && (
                  <DropdownMenuItem onClick={() => onStatusChange(row.original.id, "ACTIVE")}>
                    <UserCheck className="mr-2 h-4 w-4" /> Activate
                  </DropdownMenuItem>
                )}
                {row.original.status !== "EXPIRED" && (
                  <DropdownMenuItem onClick={() => onStatusChange(row.original.id, "EXPIRED")}>
                    <Clock className="mr-2 h-4 w-4" /> Mark Expired
                  </DropdownMenuItem>
                )}
                {row.original.status !== "SUSPENDED" && (
                  <DropdownMenuItem onClick={() => onStatusChange(row.original.id, "SUSPENDED")}>
                    <Ban className="mr-2 h-4 w-4" /> Suspend
                  </DropdownMenuItem>
                )}
                {row.original.status !== "DISABLED" && (
                  <DropdownMenuItem onClick={() => onStatusChange(row.original.id, "DISABLED")}>
                    <UserX className="mr-2 h-4 w-4" /> Disable
                  </DropdownMenuItem>
                )}
              </>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(row.original.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
