"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Payment, Subscriber, Invoice } from "@/generated/prisma";
import type { Serialized } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Receipt } from "lucide-react";
import { SortableHeader } from "@/components/tables/sortable-header";
import Link from "next/link";
import { format } from "date-fns";

type PaymentWithRelations = Serialized<Payment & {
  subscriber: Pick<Subscriber, "id" | "name" | "phone">;
  invoice: Pick<Invoice, "id" | "invoiceNumber"> | null;
}>;

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  COMPLETED: "default",
  PENDING: "outline",
  FAILED: "destructive",
  CANCELLED: "secondary",
  REFUNDED: "outline",
};

const methodColors: Record<string, string> = {
  CASH: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  UPI: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  CARD: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  BANK_TRANSFER:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  PAYMENT_GATEWAY:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  VOUCHER: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
};

interface PaymentColumnsProps {
  onViewReceipt?: (id: string) => void;
}

export function getPaymentColumns({
  onViewReceipt,
}: PaymentColumnsProps = {}): ColumnDef<PaymentWithRelations>[] {
  return [
    {
      accessorKey: "createdAt",
      header: ({ column }) => <SortableHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <span className="text-sm">
          {format(new Date(row.original.createdAt), "dd MMM yyyy HH:mm")}
        </span>
      ),
    },
    {
      id: "subscriber",
      accessorFn: (row) => `${row.subscriber.name} ${row.subscriber.phone}`,
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
      id: "invoice",
      accessorFn: (row) => row.invoice?.invoiceNumber ?? "",
      header: "Invoice",
      cell: ({ row }) =>
        row.original.invoice ? (
          <Link
            href={`/billing/invoices/${row.original.invoice.id}`}
            className="font-mono text-sm hover:underline"
          >
            {row.original.invoice.invoiceNumber}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => <SortableHeader column={column} title="Amount" />,
      cell: ({ row }) => (
        <span className="text-sm font-semibold">
          ₹{Number(row.original.amount).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) => (
        <Badge className={methodColors[row.original.method]}>
          {row.original.method.replace("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "transactionId",
      header: "Transaction ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.transactionId || "-"}
        </span>
      ),
    },
    {
      accessorKey: "gatewayProvider",
      header: "Gateway",
      cell: ({ row }) =>
        row.original.gatewayProvider ? (
          <span className="text-sm capitalize">
            {row.original.gatewayProvider.toLowerCase()}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.status] || "default"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const payment = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {payment.invoice && (
                <DropdownMenuItem asChild>
                  <Link href={`/billing/invoices/${payment.invoice.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Invoice
                  </Link>
                </DropdownMenuItem>
              )}
              {onViewReceipt && payment.receiptUrl && (
                <DropdownMenuItem onClick={() => onViewReceipt(payment.id)}>
                  <Receipt className="mr-2 h-4 w-4" />
                  View Receipt
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
