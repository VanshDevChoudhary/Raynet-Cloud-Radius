"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { invoiceSchema, type CreateInvoiceInput } from "@/lib/validations/invoice.schema";
import type { Subscriber, Plan } from "@/generated/prisma";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft } from "lucide-react";
import { useTransition, useEffect, useState } from "react";
import { createInvoice } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface InvoiceFormProps {
  subscribers: Serialized<Subscriber>[];
  plans: Serialized<Plan>[];
  taxRate?: number;
  taxLabel?: string;
}

export function InvoiceForm({ subscribers, plans, taxRate = 0, taxLabel = "Tax" }: InvoiceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedSubscriberId, setSelectedSubscriberId] = useState<string>("");
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0);

  const form = useForm<CreateInvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      subscriberId: "",
      planId: "",
      amount: 0,
      tax: 0,
      discount: 0,
      invoiceDate: new Date(),
      dueDate: new Date(),
      description: "",
      notes: "",
    },
  });

  const autoCalcTax = (amount: number) => {
    if (taxRate > 0) {
      const tax = Math.round((amount * taxRate) / 100 * 100) / 100;
      form.setValue("tax", tax);
    }
  };

  // Auto-fill plan when subscriber is selected
  useEffect(() => {
    if (selectedSubscriberId) {
      const subscriber = subscribers.find((s) => s.id === selectedSubscriberId);
      if (subscriber?.planId) {
        form.setValue("planId", subscriber.planId);
        const plan = plans.find((p) => p.id === subscriber.planId);
        if (plan) {
          const amount = Number(plan.price);
          form.setValue("amount", amount);
          form.setValue("description", `${plan.name} - ${plan.validityDays || 30} days`);
          autoCalcTax(amount);
        }
      }
    }
  }, [selectedSubscriberId, subscribers, plans, form]);

  // Calculate total when amount, tax, or discount changes
  const watchAmount = form.watch("amount");
  const watchTax = form.watch("tax");
  const watchDiscount = form.watch("discount");

  // Auto-recalculate tax when amount changes
  useEffect(() => {
    const amount = Number(watchAmount) || 0;
    if (taxRate > 0 && amount > 0) {
      autoCalcTax(amount);
    }
  }, [watchAmount]);

  useEffect(() => {
    const amount = Number(watchAmount) || 0;
    const tax = Number(watchTax) || 0;
    const discount = Number(watchDiscount) || 0;
    const total = amount + tax - discount;
    setCalculatedTotal(total);
  }, [watchAmount, watchTax, watchDiscount]);

  const onSubmit = (data: CreateInvoiceInput) => {
    startTransition(async () => {
      const result = await createInvoice(data);

      if (result.success) {
        toast.success("Invoice created successfully");
        router.push("/billing/invoices");
      } else {
        toast.error(result.error ?? "Failed to create invoice");
      }
    });
  };

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/billing/invoices">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <CardTitle>New Invoice</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Subscriber Selection */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Subscriber</h4>
            <div className="space-y-2">
              <Label>Select Subscriber *</Label>
              <Select
                value={form.watch("subscriberId")}
                onValueChange={(value) => {
                  form.setValue("subscriberId", value);
                  setSelectedSubscriberId(value);
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
          </div>

          <Separator />

          {/* Plan Selection */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Plan (Optional)</h4>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select
                value={form.watch("planId")}
                onValueChange={(value) => {
                  form.setValue("planId", value);
                  const plan = plans.find((p) => p.id === value);
                  if (plan) {
                    const amount = Number(plan.price);
                    form.setValue("amount", amount);
                    form.setValue("description", `${plan.name} - ${plan.validityDays || 30} days`);
                    autoCalcTax(amount);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - ₹{Number(plan.price).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Invoice Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Invoice Details</h4>
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
                <Label>{taxLabel}{taxRate > 0 ? ` (${taxRate}%)` : ""}</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("tax", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Discount</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("discount", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label>Total (Calculated)</Label>
                <Input
                  value={`₹${calculatedTotal.toFixed(2)}`}
                  disabled
                  className="font-semibold"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Dates</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Invoice Date *</Label>
                <Input type="date" {...form.register("invoiceDate")} />
                {form.formState.errors.invoiceDate && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.invoiceDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input type="date" {...form.register("dueDate")} />
                {form.formState.errors.dueDate && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.dueDate.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Additional Information</h4>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...form.register("description")} placeholder="Service description..." />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                {...form.register("notes")}
                placeholder="Internal notes (optional)..."
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/billing/invoices">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Invoice
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
