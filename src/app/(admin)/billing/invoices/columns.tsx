"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Invoice, Subscriber, Plan } from "@/generated/prisma";
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
import {
  MoreHorizontal,
  Eye,
  DollarSign,
  Download,
  XCircle,
  FileText,
} from "lucide-react";
import { SortableHeader } from "@/components/tables/sortable-header";
import Link from "next/link";
import { format } from "date-fns";

type InvoiceWithRelations = Serialized<Invoice & {
  subscriber: Pick<Subscriber, "id" | "name" | "phone" | "username">;
  plan: Pick<Plan, "id" | "name"> | null;
  _count: { payments: number };
}>;

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  DRAFT: "outline",
  ISSUED: "default",
  PAID: "secondary",
  OVERDUE: "destructive",
  CANCELLED: "destructive",
  REFUNDED: "outline",
};

const statusColors: Record<string, string> = {
  PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  ISSUED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  REFUNDED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

interface InvoiceColumnsProps {
  onRecordPayment: (invoice: InvoiceWithRelations) => void;
  onCancel: (id: string) => void;
  onDownloadPdf: (id: string) => void;
}

export function getInvoiceColumns({
  onRecordPayment,
  onCancel,
  onDownloadPdf,
}: InvoiceColumnsProps): ColumnDef<InvoiceWithRelations>[] {
  return [
    {
      accessorKey: "invoiceNumber",
      header: ({ column }) => <SortableHeader column={column} title="Invoice #" />,
      cell: ({ row }) => (
        <Link
          href={`/billing/invoices/${row.original.id}`}
          className="font-mono font-medium hover:underline"
        >
          {row.original.invoiceNumber}
        </Link>
      ),
    },
    {
      accessorKey: "invoiceDate",
      header: ({ column }) => <SortableHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <span className="text-sm">
          {format(new Date(row.original.invoiceDate), "dd MMM yyyy")}
        </span>
      ),
    },
    {
      accessorKey: "subscriber",
      header: "Subscriber",
      cell: ({ row }) => (
        <div>
          <Link
            href={`/subscribers/${row.original.subscriber.id}`}
            className="font-medium hover:underline"
          >
            {row.original.subscriber.name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {row.original.subscriber.phone}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "plan",
      header: "Plan",
      cell: ({ row }) =>
        row.original.plan ? (
          <span className="text-sm">{row.original.plan.name}</span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => <SortableHeader column={column} title="Amount" />,
      cell: ({ row }) => (
        <span className="text-sm">₹{Number(row.original.amount).toFixed(2)}</span>
      ),
    },
    {
      accessorKey: "tax",
      header: "Tax",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          ₹{Number(row.original.tax).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "total",
      header: ({ column }) => <SortableHeader column={column} title="Total" />,
      cell: ({ row }) => (
        <span className="text-sm font-semibold">
          ₹{Number(row.original.total).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "balanceDue",
      header: "Balance",
      cell: ({ row }) => {
        const balance = Number(row.original.balanceDue);
        return (
          <span
            className={`text-sm font-medium ${balance > 0 ? "text-orange-600" : "text-green-600"}`}
          >
            ₹{balance.toFixed(2)}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={statusVariant[row.original.status] || "default"}
          className={statusColors[row.original.status]}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "dueDate",
      header: ({ column }) => <SortableHeader column={column} title="Due Date" />,
      cell: ({ row }) => {
        const date = new Date(row.original.dueDate);
        const isOverdue = date < new Date() && row.original.status !== "PAID";
        return (
          <span className={`text-sm ${isOverdue ? "text-destructive font-medium" : ""}`}>
            {format(date, "dd MMM yyyy")}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const invoice = row.original;
        const canRecordPayment = invoice.status !== "PAID" && invoice.status !== "CANCELLED";
        const canCancel = invoice.status !== "PAID" && invoice.status !== "CANCELLED";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/billing/invoices/${invoice.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDownloadPdf(invoice.id)}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </DropdownMenuItem>
              {canRecordPayment && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onRecordPayment(invoice)}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Record Payment
                  </DropdownMenuItem>
                </>
              )}
              {canCancel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onCancel(invoice.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Invoice
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
