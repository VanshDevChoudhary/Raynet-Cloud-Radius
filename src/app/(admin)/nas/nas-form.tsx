"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { nasDeviceSchema, type CreateNasDeviceInput } from "@/lib/validations/nas.schema";
import type { NasDevice, Location } from "@/generated/prisma";
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
import { Loader2 } from "lucide-react";
import { useTransition, useEffect } from "react";
import { createNasDevice, updateNasDevice } from "./actions";
import { toast } from "sonner";

type NasWithLocation = NasDevice & { location: Location | null };

interface NasFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nas?: NasWithLocation | null;
  locations: Location[];
}

export function NasForm({ open, onOpenChange, nas, locations }: NasFormProps) {
  const [isPending, startTransition] = useTransition();

  const getFormValues = (n?: NasWithLocation | null) =>
    n
      ? {
          name: n.name,
          shortName: n.shortName ?? "",
          nasIp: n.nasIp,
          secret: n.secret,
          nasType: n.nasType,
          description: n.description ?? "",
          locationId: n.locationId,
          ports: n.ports,
          community: n.community ?? "",
          status: n.status,
        }
      : {
          name: "",
          shortName: "",
          nasIp: "",
          secret: "",
          nasType: "MIKROTIK" as const,
          description: "",
          locationId: null,
          status: "ACTIVE" as const,
        };

  const form = useForm<CreateNasDeviceInput>({
    resolver: zodResolver(nasDeviceSchema),
    defaultValues: getFormValues(nas),
  });

  useEffect(() => {
    form.reset(getFormValues(nas));
  }, [nas?.id]);

  const onSubmit = (data: CreateNasDeviceInput) => {
    startTransition(async () => {
      const result = nas
        ? await updateNasDevice(nas.id, data)
        : await createNasDevice(data);

      if (result.success) {
        toast.success(nas ? "NAS device updated" : "NAS device created");
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{nas ? "Edit NAS Device" : "Add NAS Device"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">NAS Name *</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="shortName">Short Name</Label>
              <Input id="shortName" {...form.register("shortName")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nasIp">IP Address *</Label>
              <Input id="nasIp" {...form.register("nasIp")} placeholder="192.168.1.1" />
              {form.formState.errors.nasIp && (
                <p className="text-xs text-destructive">{form.formState.errors.nasIp.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret">RADIUS Secret *</Label>
              <Input id="secret" type="password" {...form.register("secret")} />
              {form.formState.errors.secret && (
                <p className="text-xs text-destructive">{form.formState.errors.secret.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>NAS Type</Label>
              <Select
                value={form.watch("nasType")}
                onValueChange={(v) => form.setValue("nasType", v as CreateNasDeviceInput["nasType"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MIKROTIK">MikroTik</SelectItem>
                  <SelectItem value="CISCO">Cisco</SelectItem>
                  <SelectItem value="UBIQUITI">Ubiquiti</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={form.watch("locationId") ?? "none"}
                onValueChange={(v) => form.setValue("locationId", v === "none" ? null : v)}
              >
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No location</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name} ({loc.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) => form.setValue("status", v as CreateNasDeviceInput["status"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ports">Ports</Label>
              <Input id="ports" type="number" {...form.register("ports")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} {...form.register("description")} />
          </div>

          {Object.keys(form.formState.errors).length > 0 && (
            <p className="text-sm text-destructive">
              Please fix the errors above:{" "}
              {Object.entries(form.formState.errors)
                .map(([key, err]) => `${key}: ${err?.message}`)
                .join(", ")}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {nas ? "Update" : "Add NAS Device"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
