"use client";

import { useState, useTransition } from "react";
import type { Invoice, Subscriber, Plan } from "@/generated/prisma";
import type { Serialized } from "@/lib/types";
import { DataTable } from "@/components/tables/data-table";
import { getInvoiceColumns } from "./columns";
import { cancelInvoice, downloadInvoicePdf } from "./actions";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type InvoiceWithRelations = Serialized<Invoice & {
  subscriber: Pick<Subscriber, "id" | "name" | "phone" | "username">;
  plan: Pick<Plan, "id" | "name"> | null;
  _count: { payments: number };
}>;

type SubscriberBasic = Serialized<Pick<Subscriber, "id" | "name" | "phone" | "username" | "email" | "planId" | "status">>;

interface InvoiceTableProps {
  data: InvoiceWithRelations[];
  subscribers: SubscriberBasic[];
}

export function InvoiceTable({ data, subscribers }: InvoiceTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithRelations | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [, startTransition] = useTransition();

  const handleRecordPayment = (invoice: InvoiceWithRelations) => {
    setSelectedInvoice(invoice);
    setShowPaymentDialog(true);
  };

  const handleCancel = (id: string) => {
    const reason = prompt("Enter cancellation reason (optional):");
    if (reason === null) return;

    startTransition(async () => {
      const result = await cancelInvoice(id, reason || undefined);
      if (result.success) {
        toast.success("Invoice cancelled");
      } else {
        toast.error(result.error ?? "Failed to cancel invoice");
      }
    });
  };

  const handleDownloadPdf = (id: string) => {
    startTransition(async () => {
      const result = await downloadInvoicePdf(id);
      if (result.success && result.data) {
        window.open(result.data, "_blank");
      } else {
        toast.error(result.error ?? "Failed to download PDF");
      }
    });
  };

  const columns = getInvoiceColumns({
    onRecordPayment: handleRecordPayment,
    onCancel: handleCancel,
    onDownloadPdf: handleDownloadPdf,
  });

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Search by invoice #, subscriber name..."
        filters={[
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Issued", value: "ISSUED" },
              { label: "Paid", value: "PAID" },
              { label: "Overdue", value: "OVERDUE" },
              { label: "Cancelled", value: "CANCELLED" },
              { label: "Draft", value: "DRAFT" },
            ],
          },
        ]}
        toolbar={
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href="/billing/invoices/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      <RecordPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        subscribers={subscribers}
        preSelectedSubscriberId={selectedInvoice?.subscriber.id}
        preSelectedInvoiceId={selectedInvoice?.id}
        preSelectedAmount={selectedInvoice ? Number(selectedInvoice.balanceDue) : undefined}
      />
    </>
  );
}
