"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Plan } from "@/generated/prisma";
import type { Serialized } from "@/lib/types";
import { Users } from "lucide-react";

export type PlanWithCount = Plan & { _count: { subscribers: number } };
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, ToggleLeft, Trash2, Copy } from "lucide-react";
import { SortableHeader } from "@/components/tables/sortable-header";

interface PlanColumnsProps {
  onEdit: (plan: Serialized<PlanWithCount>) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onClone: (plan: Serialized<PlanWithCount>) => void;
}

export function getPlanColumns({
  onEdit,
  onToggle,
  onDelete,
  onClone,
}: PlanColumnsProps): ColumnDef<Serialized<PlanWithCount>>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title="Plan Name" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          {row.original.description && (
            <p className="text-xs text-muted-foreground">{row.original.description}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "speed",
      header: "Speed",
      cell: ({ row }) => {
        const { downloadSpeed, uploadSpeed, speedUnit } = row.original;
        return (
          <span className="text-sm">
            {downloadSpeed}/{uploadSpeed} {speedUnit}
          </span>
        );
      },
    },
    {
      accessorKey: "dataLimit",
      header: "Data Limit",
      cell: ({ row }) => {
        const { dataLimit, dataUnit } = row.original;
        if (dataUnit === "UNLIMITED") return <span className="text-sm">Unlimited</span>;
        return (
          <span className="text-sm">
            {dataLimit} {dataUnit}
          </span>
        );
      },
    },
    {
      accessorKey: "validityDays",
      header: ({ column }) => <SortableHeader column={column} title="Validity" />,
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.validityDays} {row.original.validityUnit.toLowerCase()}
        </span>
      ),
    },
    {
      accessorKey: "price",
      header: ({ column }) => <SortableHeader column={column} title="Price" />,
      cell: ({ row }) => (
        <span className="font-medium">
          ₹{Number(row.original.price).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "billingType",
      header: "Billing",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.billingType}
        </Badge>
      ),
    },
    {
      accessorKey: "planType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs">
          {row.original.planType}
        </Badge>
      ),
    },
    {
      id: "subscribers",
      header: "Subscribers",
      cell: ({ row }) => {
        const count = row.original._count.subscribers;
        return (
          <span className="flex items-center gap-1 text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            {count}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const active = row.original.status === "ACTIVE";
        return (
          <Badge variant={active ? "default" : "secondary"}>
            {row.original.status}
          </Badge>
        );
      },
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
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onClone(row.original)}>
              <Copy className="mr-2 h-4 w-4" /> Clone
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggle(row.original.id)}>
              <ToggleLeft className="mr-2 h-4 w-4" />
              {row.original.status === "ACTIVE" ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(row.original.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
