"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { NasDevice, Location } from "@/generated/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import { SortableHeader } from "@/components/tables/sortable-header";

export type NasWithLocation = NasDevice & {
  location: Location | null;
  _count: { subscribers: number };
};

interface NasColumnsProps {
  onEdit: (nas: NasWithLocation) => void;
  onDelete: (id: string) => void;
}

export function getNasColumns({ onEdit, onDelete }: NasColumnsProps): ColumnDef<NasWithLocation>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          {row.original.shortName && (
            <p className="text-xs text-muted-foreground">{row.original.shortName}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "nasIp",
      header: ({ column }) => <SortableHeader column={column} title="IP Address" />,
      cell: ({ row }) => (
        <code className="text-sm">{row.original.nasIp}</code>
      ),
    },
    {
      accessorKey: "nasType",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.nasType}</Badge>
      ),
    },
    {
      accessorKey: "location",
      header: "Location",
      cell: ({ row }) => row.original.location?.name ?? "-",
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
        const status = row.original.status;
        const variant = status === "ACTIVE" ? "default" : status === "UNREACHABLE" ? "destructive" : "secondary";
        return <Badge variant={variant}>{status}</Badge>;
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
