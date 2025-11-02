"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { planSchema, type CreatePlanInput } from "@/lib/validations/plan.schema";
import type { Plan } from "@/generated/prisma";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useState, useEffect, useTransition } from "react";
import { createPlan, updatePlan } from "./actions";
import { toast } from "sonner";

interface PlanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: Serialized<Plan> | null;
}

function getFormValues(plan: Serialized<Plan> | null | undefined): CreatePlanInput {
  if (plan) {
    return {
      name: plan.name,
      description: plan.description ?? "",
      downloadSpeed: plan.downloadSpeed,
      uploadSpeed: plan.uploadSpeed,
      speedUnit: plan.speedUnit,
      dataLimit: plan.dataLimit,
      dataUnit: plan.dataUnit,
      validityDays: plan.validityDays,
      validityUnit: plan.validityUnit,
      price: Number(plan.price),
      billingType: plan.billingType,
      planType: plan.planType,
      fupDownloadSpeed: plan.fupDownloadSpeed,
      fupUploadSpeed: plan.fupUploadSpeed,
      fupSpeedUnit: plan.fupSpeedUnit,
      burstDownloadSpeed: plan.burstDownloadSpeed,
      burstUploadSpeed: plan.burstUploadSpeed,
      burstThreshold: plan.burstThreshold,
      burstTime: plan.burstTime,
      timeSlotStart: plan.timeSlotStart ?? "",
      timeSlotEnd: plan.timeSlotEnd ?? "",
      simultaneousDevices: plan.simultaneousDevices,
      priority: plan.priority,
      poolName: plan.poolName ?? "",
      status: plan.status,
    };
  }
  return {
    name: "",
    description: "",
    downloadSpeed: 10,
    uploadSpeed: 10,
    speedUnit: "MBPS",
    dataLimit: null,
    dataUnit: "UNLIMITED",
    validityDays: 30,
    validityUnit: "DAYS",
    price: 0,
    billingType: "PREPAID",
    planType: "PPPOE",
    simultaneousDevices: 1,
    priority: 8,
    status: "ACTIVE",
  };
}

export function PlanForm({ open, onOpenChange, plan }: PlanFormProps) {
  const [isPending, startTransition] = useTransition();
  const [showFup, setShowFup] = useState(
    !!(plan?.fupDownloadSpeed || plan?.fupUploadSpeed)
  );
  const [showBurst, setShowBurst] = useState(
    !!(plan?.burstDownloadSpeed || plan?.burstUploadSpeed)
  );
  const [showTimeSlot, setShowTimeSlot] = useState(
    !!(plan?.timeSlotStart || plan?.timeSlotEnd)
  );

  const form = useForm<CreatePlanInput>({
    resolver: zodResolver(planSchema),
    defaultValues: getFormValues(plan),
  });

  // Reset form when plan changes (edit different plan or switch to create)
  useEffect(() => {
    form.reset(getFormValues(plan));
    setShowFup(!!(plan?.fupDownloadSpeed || plan?.fupUploadSpeed));
    setShowBurst(!!(plan?.burstDownloadSpeed || plan?.burstUploadSpeed));
    setShowTimeSlot(!!(plan?.timeSlotStart || plan?.timeSlotEnd));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id]);

  const onSubmit = (data: CreatePlanInput) => {
    startTransition(async () => {
      const result = plan
        ? await updatePlan(plan.id, data)
        : await createPlan(data);

      if (result.success) {
        toast.success(plan ? "Plan updated" : "Plan created");
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit Plan" : "Create Plan"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input id="price" type="number" step="0.01" {...form.register("price")} />
                {form.formState.errors.price && (
                  <p className="text-xs text-destructive">{form.formState.errors.price.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={2} {...form.register("description")} />
            </div>
          </div>

          <Separator />

          {/* Speed */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Bandwidth</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Download Speed *</Label>
                <Input type="number" {...form.register("downloadSpeed")} />
              </div>
              <div className="space-y-2">
                <Label>Upload Speed *</Label>
                <Input type="number" {...form.register("uploadSpeed")} />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select
                  value={form.watch("speedUnit")}
                  onValueChange={(v) => form.setValue("speedUnit", v as "KBPS" | "MBPS")}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MBPS">Mbps</SelectItem>
                    <SelectItem value="KBPS">Kbps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Data & Validity */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Data & Validity</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Data Unit</Label>
                <Select
                  value={form.watch("dataUnit")}
                  onValueChange={(v) => form.setValue("dataUnit", v as CreatePlanInput["dataUnit"])}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNLIMITED">Unlimited</SelectItem>
                    <SelectItem value="MB">MB</SelectItem>
                    <SelectItem value="GB">GB</SelectItem>
                    <SelectItem value="TB">TB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.watch("dataUnit") !== "UNLIMITED" && (
                <div className="space-y-2">
                  <Label>Data Limit</Label>
                  <Input type="number" {...form.register("dataLimit")} />
                </div>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Validity *</Label>
                <Input type="number" {...form.register("validityDays")} />
              </div>
              <div className="space-y-2">
                <Label>Validity Unit</Label>
                <Select
                  value={form.watch("validityUnit")}
                  onValueChange={(v) => form.setValue("validityUnit", v as CreatePlanInput["validityUnit"])}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOURS">Hours</SelectItem>
                    <SelectItem value="DAYS">Days</SelectItem>
                    <SelectItem value="WEEKS">Weeks</SelectItem>
                    <SelectItem value="MONTHS">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Billing & Type */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Billing Type</Label>
              <Select
                value={form.watch("billingType")}
                onValueChange={(v) => form.setValue("billingType", v as "PREPAID" | "POSTPAID")}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PREPAID">Prepaid</SelectItem>
                  <SelectItem value="POSTPAID">Postpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plan Type</Label>
              <Select
                value={form.watch("planType")}
                onValueChange={(v) => form.setValue("planType", v as "PPPOE" | "HOTSPOT" | "BOTH")}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PPPOE">PPPoE</SelectItem>
                  <SelectItem value="HOTSPOT">Hotspot</SelectItem>
                  <SelectItem value="BOTH">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Simultaneous Devices</Label>
              <Input type="number" {...form.register("simultaneousDevices")} />
            </div>
          </div>

          <Separator />

          {/* FUP */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Fair Usage Policy (FUP)</h4>
              <Switch checked={showFup} onCheckedChange={setShowFup} />
            </div>
            {showFup && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>FUP Download Speed</Label>
                  <Input type="number" {...form.register("fupDownloadSpeed")} />
                </div>
                <div className="space-y-2">
                  <Label>FUP Upload Speed</Label>
                  <Input type="number" {...form.register("fupUploadSpeed")} />
                </div>
                <div className="space-y-2">
                  <Label>FUP Speed Unit</Label>
                  <Select
                    value={form.watch("fupSpeedUnit") ?? "MBPS"}
                    onValueChange={(v) => form.setValue("fupSpeedUnit", v as "KBPS" | "MBPS")}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MBPS">Mbps</SelectItem>
                      <SelectItem value="KBPS">Kbps</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Burst */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Burst Settings</h4>
              <Switch checked={showBurst} onCheckedChange={setShowBurst} />
            </div>
            {showBurst && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Burst Download Speed</Label>
                  <Input type="number" {...form.register("burstDownloadSpeed")} />
                </div>
                <div className="space-y-2">
                  <Label>Burst Upload Speed</Label>
                  <Input type="number" {...form.register("burstUploadSpeed")} />
                </div>
                <div className="space-y-2">
                  <Label>Burst Threshold (%)</Label>
                  <Input type="number" {...form.register("burstThreshold")} />
                </div>
                <div className="space-y-2">
                  <Label>Burst Time (sec)</Label>
                  <Input type="number" {...form.register("burstTime")} />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Time Slot */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Time Restriction</h4>
              <Switch checked={showTimeSlot} onCheckedChange={setShowTimeSlot} />
            </div>
            {showTimeSlot && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" {...form.register("timeSlotStart")} />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" {...form.register("timeSlotEnd")} />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Advanced */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Priority (1-8)</Label>
              <Input type="number" min={1} max={8} {...form.register("priority")} />
            </div>
            <div className="space-y-2">
              <Label>Pool Name</Label>
              <Input {...form.register("poolName")} placeholder="e.g., pool-residential" />
            </div>
          </div>

          {Object.keys(form.formState.errors).length > 0 && (
            <p className="text-sm text-destructive">
              Please fix the errors above:{" "}
              {Object.entries(form.formState.errors)
                .map(([key, err]) => `${key}: ${err?.message}`)
                .join(", ")}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {plan ? "Update Plan" : "Create Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
