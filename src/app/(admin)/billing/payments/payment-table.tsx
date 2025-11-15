"use client";

import { useState } from "react";
import type { Payment, Subscriber, Invoice } from "@/generated/prisma";
import type { Serialized } from "@/lib/types";
import { DataTable } from "@/components/tables/data-table";
import { getPaymentColumns } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { RecordPaymentDialog } from "./record-payment-dialog";

type PaymentWithRelations = Serialized<Payment & {
  subscriber: Pick<Subscriber, "id" | "name" | "phone">;
  invoice: Pick<Invoice, "id" | "invoiceNumber"> | null;
}>;

interface PaymentTableProps {
  data: PaymentWithRelations[];
  subscribers: Serialized<Subscriber>[];
}

export function PaymentTable({ data, subscribers }: PaymentTableProps) {
  const [showRecordDialog, setShowRecordDialog] = useState(false);

  const handleViewReceipt = (id: string) => {
    // TODO: Implement receipt viewing
    console.log("View receipt:", id);
  };

  const columns = getPaymentColumns({ onViewReceipt: handleViewReceipt });

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search by subscriber, invoice #, transaction ID..."
        filters={[
          {
            key: "method",
            label: "Method",
            options: [
              { label: "Cash", value: "CASH" },
              { label: "UPI", value: "UPI" },
              { label: "Card", value: "CARD" },
              { label: "Bank Transfer", value: "BANK_TRANSFER" },
              { label: "Payment Gateway", value: "PAYMENT_GATEWAY" },
              { label: "Voucher", value: "VOUCHER" },
            ],
          },
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Completed", value: "COMPLETED" },
              { label: "Pending", value: "PENDING" },
              { label: "Failed", value: "FAILED" },
              { label: "Cancelled", value: "CANCELLED" },
            ],
          },
        ]}
        toolbar={
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowRecordDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      <RecordPaymentDialog
        open={showRecordDialog}
        onOpenChange={setShowRecordDialog}
        subscribers={subscribers}
      />
    </>
  );
}
