"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { locationSchema, type CreateLocationInput } from "@/lib/validations/location.schema";
import type { Location } from "@/generated/prisma";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useTransition, useEffect } from "react";
import { createLocation, updateLocation } from "./actions";
import { toast } from "sonner";

interface LocationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: Location | null;
  allLocations: Location[];
  defaultParentId?: string | null;
  defaultType?: string;
}

export function LocationForm({
  open,
  onOpenChange,
  location,
  allLocations,
  defaultParentId,
  defaultType,
}: LocationFormProps) {
  const [isPending, startTransition] = useTransition();

  const getFormValues = () =>
    location
      ? {
          name: location.name,
          type: location.type,
          parentId: location.parentId,
        }
      : {
          name: "",
          type: (defaultType as CreateLocationInput["type"]) ?? "AREA",
          parentId: defaultParentId ?? null,
        };

  const form = useForm<CreateLocationInput>({
    resolver: zodResolver(locationSchema),
    defaultValues: getFormValues(),
  });

  useEffect(() => {
    form.reset(getFormValues());
  }, [location?.id, defaultParentId, defaultType]);

  // Filter parent options based on hierarchy
  const watchType = form.watch("type");
  const parentOptions = allLocations.filter((loc) => {
    if (location?.id && loc.id === location.id) return false;
    if (watchType === "REGION") return false; // Regions have no parent
    if (watchType === "CITY") return loc.type === "REGION";
    if (watchType === "AREA") return loc.type === "CITY";
    return false;
  });

  const onSubmit = (data: CreateLocationInput) => {
    startTransition(async () => {
      const result = location
        ? await updateLocation(location.id, data)
        : await createLocation(data);

      if (result.success) {
        toast.success(location ? "Location updated" : "Location created");
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{location ? "Edit Location" : "Add Location"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Location Name *</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Type *</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(v) => {
                form.setValue("type", v as CreateLocationInput["type"]);
                form.setValue("parentId", null); // Reset parent when type changes
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="REGION">Region</SelectItem>
                <SelectItem value="CITY">City</SelectItem>
                <SelectItem value="AREA">Area</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {watchType !== "REGION" && (
            <div className="space-y-2">
              <Label>Parent Location</Label>
              <Select
                value={form.watch("parentId") ?? "none"}
                onValueChange={(v) => form.setValue("parentId", v === "none" ? null : v)}
              >
                <SelectTrigger><SelectValue placeholder="Select parent" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {parentOptions.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {location ? "Update" : "Add Location"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
