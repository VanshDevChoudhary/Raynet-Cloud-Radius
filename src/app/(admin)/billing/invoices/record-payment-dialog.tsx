"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentSchema, type RecordPaymentInput } from "@/lib/validations/payment.schema";
import type { Subscriber } from "@/generated/prisma";
import type { Serialized } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useTransition, useEffect, useState } from "react";
import { recordPayment } from "../payments/actions";
import { getPendingInvoices } from "./actions";
import { toast } from "sonner";
import { PaymentMethod } from "@/generated/prisma";

type SubscriberBasic = Serialized<Pick<Subscriber, "id" | "name" | "phone" | "username" | "email" | "planId" | "status">>;

interface PendingInvoice {
  id: string;
  invoiceNumber: string;
  balanceDue: string;
}

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscribers: SubscriberBasic[];
  preSelectedSubscriberId?: string;
  preSelectedInvoiceId?: string;
  preSelectedAmount?: number;
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  subscribers,
  preSelectedSubscriberId,
  preSelectedInvoiceId,
  preSelectedAmount,
}: RecordPaymentDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedSubscriberId, setSelectedSubscriberId] = useState<string>("");
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const form = useForm<RecordPaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      subscriberId: "",
      invoiceId: undefined,
      amount: 0,
      method: "CASH",
      transactionId: "",
      notes: "",
      status: "COMPLETED",
    },
  });

  // Pre-fill when dialog opens with pre-selected values
  useEffect(() => {
    if (open && preSelectedSubscriberId) {
      form.setValue("subscriberId", preSelectedSubscriberId);
      setSelectedSubscriberId(preSelectedSubscriberId);
      if (preSelectedInvoiceId) {
        form.setValue("invoiceId", preSelectedInvoiceId);
      }
      if (preSelectedAmount && preSelectedAmount > 0) {
        form.setValue("amount", preSelectedAmount);
      }
    }
    if (!open) {
      form.reset();
      setSelectedSubscriberId("");
      setPendingInvoices([]);
    }
  }, [open, preSelectedSubscriberId, preSelectedInvoiceId, preSelectedAmount, form]);

  // Fetch pending invoices when subscriber is selected
  useEffect(() => {
    if (selectedSubscriberId) {
      setLoadingInvoices(true);
      getPendingInvoices(selectedSubscriberId).then((result) => {
        if (result.success && result.data) {
          setPendingInvoices(result.data);
        } else {
          setPendingInvoices([]);
        }
        setLoadingInvoices(false);
      });
    } else {
      setPendingInvoices([]);
    }
  }, [selectedSubscriberId]);

  const onSubmit = (data: RecordPaymentInput) => {
    // Clean up invoiceId if empty string
    const cleanData = {
      ...data,
      invoiceId: data.invoiceId || undefined,
    };
    startTransition(async () => {
      const result = await recordPayment(cleanData);

      if (result.success) {
        toast.success("Payment recorded successfully");
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error ?? "Failed to record payment");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Subscriber Selection */}
          <div className="space-y-2">
            <Label>Subscriber *</Label>
            <Select
              value={form.watch("subscriberId")}
              onValueChange={(value) => {
                form.setValue("subscriberId", value);
                setSelectedSubscriberId(value);
                form.setValue("invoiceId", undefined);
                form.setValue("amount", 0);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose subscriber..." />
              </SelectTrigger>
              <SelectContent>
                {subscribers.map((subscriber) => (
                  <SelectItem key={subscriber.id} value={subscriber.id}>
                    {subscriber.name} ({subscriber.phone})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.subscriberId && (
              <p className="text-xs text-destructive">
                {form.formState.errors.subscriberId.message}
              </p>
            )}
          </div>

          <Separator />

          {/* Invoice Selection */}
          <div className="space-y-2">
            <Label>Link to Invoice (Optional)</Label>
            <Select
              value={form.watch("invoiceId") || "none"}
              onValueChange={(value) => {
                const invoiceId = value === "none" ? undefined : value;
                form.setValue("invoiceId", invoiceId);
                if (invoiceId) {
                  const inv = pendingInvoices.find((i) => i.id === invoiceId);
                  if (inv) {
                    form.setValue("amount", Number(inv.balanceDue));
                  }
                }
              }}
              disabled={!selectedSubscriberId || loadingInvoices}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingInvoices ? "Loading..." : "Select invoice..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No invoice</SelectItem>
                {pendingInvoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} — ₹{Number(invoice.balanceDue).toFixed(2)} due
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedSubscriberId && (
              <p className="text-xs text-muted-foreground">
                Select a subscriber first to see pending invoices
              </p>
            )}
            {selectedSubscriberId && pendingInvoices.length === 0 && !loadingInvoices && (
              <p className="text-xs text-muted-foreground">
                No pending invoices for this subscriber
              </p>
            )}
          </div>

          <Separator />

          {/* Payment Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register("amount", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {form.formState.errors.amount && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.amount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select
                value={form.watch("method")}
                onValueChange={(value) =>
                  form.setValue("method", value as PaymentMethod)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="PAYMENT_GATEWAY">Payment Gateway</SelectItem>
                  <SelectItem value="VOUCHER">Voucher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Transaction ID / Reference</Label>
              <Input
                {...form.register("transactionId")}
                placeholder="e.g., UPI123456789, Cheque #12345"
              />
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              {...form.register("notes")}
              placeholder="Additional notes (optional)..."
              rows={3}
            />
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
