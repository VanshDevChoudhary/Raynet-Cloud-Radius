"use client";

import { useForm, Controller } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveBillingPreferences } from "./actions";

interface FormValues {
  currency: string;
  invoicePrefix: string;
  taxRate: number;
  taxLabel: string;
  gracePeriodDays: number;
  autoGenerateInvoices: boolean;
}

const CURRENCIES = [
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "KES", label: "KES - Kenyan Shilling" },
  { value: "NGN", label: "NGN - Nigerian Naira" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "EUR", label: "EUR - Euro" },
];

export function BillingPreferencesForm({ settings }: { settings: Record<string, unknown> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      currency: (settings.currency as string) || "INR",
      invoicePrefix: (settings.invoicePrefix as string) || "INV-",
      taxRate: (settings.taxRate as number) || 0,
      taxLabel: (settings.taxLabel as string) || "GST",
      gracePeriodDays: (settings.gracePeriodDays as number) || 0,
      autoGenerateInvoices: (settings.autoGenerateInvoices as boolean) ?? true,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const result = await saveBillingPreferences({
        currency: data.currency,
        invoicePrefix: data.invoicePrefix,
        taxRate: Number(data.taxRate),
        taxLabel: data.taxLabel,
        gracePeriodDays: Number(data.gracePeriodDays),
        autoGenerateInvoices: data.autoGenerateInvoices,
      });

      if (result.success) {
        toast.success("Billing preferences saved successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to save");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
            <Input
              id="invoicePrefix"
              placeholder="INV-"
              {...register("invoicePrefix")}
            />
            <p className="text-xs text-muted-foreground">
              Prefix added to invoice numbers (e.g., INV-0001)
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="18"
              {...register("taxRate", {
                min: { value: 0, message: "Tax rate must be 0 or more" },
                max: { value: 100, message: "Tax rate cannot exceed 100" },
              })}
            />
            {errors.taxRate && (
              <p className="text-sm text-destructive">{errors.taxRate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxLabel">Tax Label</Label>
            <Input
              id="taxLabel"
              placeholder="GST, VAT, Tax, etc."
              {...register("taxLabel")}
            />
            <p className="text-xs text-muted-foreground">
              Label shown on invoices (e.g., GST, VAT)
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="gracePeriodDays">Grace Period (Days)</Label>
            <Input
              id="gracePeriodDays"
              type="number"
              min="0"
              max="90"
              placeholder="0"
              {...register("gracePeriodDays", {
                min: { value: 0, message: "Grace period must be 0 or more" },
                max: { value: 90, message: "Grace period cannot exceed 90 days" },
              })}
            />
            {errors.gracePeriodDays && (
              <p className="text-sm text-destructive">{errors.gracePeriodDays.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Days after expiry before service disconnection
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="autoGenerateInvoices">Auto-Generate Invoices</Label>
            <p className="text-sm text-muted-foreground">
              Automatically create invoices when a subscriber&apos;s plan renews
            </p>
          </div>
          <Controller
            name="autoGenerateInvoices"
            control={control}
            render={({ field }) => (
              <Switch
                id="autoGenerateInvoices"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </form>
    </div>
  );
}
