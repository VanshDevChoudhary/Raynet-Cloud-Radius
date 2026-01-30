"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createSmsGateway, updateSmsGateway } from "./actions";
import type { SmsGateway } from "@/generated/prisma";

interface SmsGatewayFormProps {
  children: React.ReactNode;
  gateway?: SmsGateway;
}

export function SmsGatewayForm({ children, gateway }: SmsGatewayFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = gateway
        ? await updateSmsGateway(gateway.id, formData)
        : await createSmsGateway(formData);

      if (result.success) {
        toast.success(result.message);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{gateway ? "Edit" : "Add"} SMS Gateway</DialogTitle>
          <DialogDescription>
            Configure an SMS gateway to send notifications to your subscribers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Provider */}
            <div className="space-y-2">
              <Label htmlFor="provider">
                Provider <span className="text-destructive">*</span>
              </Label>
              <Select
                name="provider"
                defaultValue={gateway?.provider || "MSG91"}
                disabled={!!gateway}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MSG91">MSG91</SelectItem>
                  <SelectItem value="TEXTLOCAL">Textlocal</SelectItem>
                  <SelectItem value="TWILIO">Twilio</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp Business API</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={gateway?.status || "ACTIVE"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Gateway Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Primary SMS Gateway"
              defaultValue={gateway?.name}
              required
            />
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">
              API Key <span className="text-destructive">*</span>
            </Label>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              placeholder="Enter your API key"
              defaultValue={gateway?.apiKey}
              required
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from your SMS provider&apos;s dashboard
            </p>
          </div>

          {/* Sender ID */}
          <div className="space-y-2">
            <Label htmlFor="senderId">
              Sender ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="senderId"
              name="senderId"
              placeholder="e.g., MYISP (6 chars)"
              maxLength={11}
              defaultValue={gateway?.senderId}
              required
            />
            <p className="text-xs text-muted-foreground">
              6-character alphanumeric ID registered with your SMS provider
            </p>
          </div>

          {/* API URL (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="apiUrl">API URL (Optional)</Label>
            <Input
              id="apiUrl"
              name="apiUrl"
              type="url"
              placeholder="https://api.example.com"
              defaultValue={gateway?.apiUrl || ""}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use the default API URL for the selected provider
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : gateway ? "Update Gateway" : "Add Gateway"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
