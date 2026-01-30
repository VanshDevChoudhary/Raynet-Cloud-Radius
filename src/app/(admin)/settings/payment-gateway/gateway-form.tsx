"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  paymentGatewaySchema,
  type CreatePaymentGatewayInput,
} from "@/lib/validations/payment-gateway.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { createPaymentGateway } from "./actions";
import { toast } from "sonner";

export function PaymentGatewayForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreatePaymentGatewayInput>({
    resolver: zodResolver(paymentGatewaySchema),
    defaultValues: {
      provider: "RAZORPAY",
      name: "",
      apiKey: "",
      apiSecret: "",
      webhookSecret: "",
      isTestMode: true,
    },
  });

  const onSubmit = (data: CreatePaymentGatewayInput) => {
    startTransition(async () => {
      const result = await createPaymentGateway(data);

      if (result.success) {
        toast.success("Payment gateway configured successfully");
        form.reset();
      } else {
        toast.error(result.error ?? "Failed to configure gateway");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Provider *</Label>
          <Select
            value={form.watch("provider")}
            onValueChange={(value: any) => form.setValue("provider", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RAZORPAY">Razorpay</SelectItem>
              <SelectItem value="CASHFREE">Cashfree (Coming Soon)</SelectItem>
              <SelectItem value="PHONEPE">PhonePe (Coming Soon)</SelectItem>
              <SelectItem value="STRIPE">Stripe (Coming Soon)</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.provider && (
            <p className="text-xs text-destructive">
              {form.formState.errors.provider.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Display Name *</Label>
          <Input
            {...form.register("name")}
            placeholder="e.g., Razorpay Production"
          />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>API Key / Key ID *</Label>
          <Input
            {...form.register("apiKey")}
            placeholder="rzp_test_..."
            type="text"
            autoComplete="off"
          />
          {form.formState.errors.apiKey && (
            <p className="text-xs text-destructive">
              {form.formState.errors.apiKey.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>API Secret / Key Secret *</Label>
          <Input
            {...form.register("apiSecret")}
            placeholder="Enter your secret key"
            type="password"
            autoComplete="new-password"
          />
          {form.formState.errors.apiSecret && (
            <p className="text-xs text-destructive">
              {form.formState.errors.apiSecret.message}
            </p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Webhook Secret (Optional)</Label>
          <Input
            {...form.register("webhookSecret")}
            placeholder="whsec_..."
            type="password"
            autoComplete="new-password"
          />
          <p className="text-xs text-muted-foreground">
            Required for webhook signature verification
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="testMode">Test Mode</Label>
          <p className="text-xs text-muted-foreground">
            Use test API keys for development and testing
          </p>
        </div>
        <Switch
          id="testMode"
          checked={form.watch("isTestMode")}
          onCheckedChange={(checked) => form.setValue("isTestMode", checked)}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Configuration
        </Button>
      </div>
    </form>
  );
}
