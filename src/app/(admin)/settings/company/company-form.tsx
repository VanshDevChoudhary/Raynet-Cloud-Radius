"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveCompanyProfile } from "./actions";

interface TenantData {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo: string | null;
  settings: Record<string, unknown>;
}

interface FormValues {
  name: string;
  domain: string;
  logo: string;
  address: string;
  phone: string;
  taxNumber: string;
}

export function CompanyForm({ tenant }: { tenant: TenantData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const settings = tenant.settings || {};

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: tenant.name || "",
      domain: tenant.domain || "",
      logo: tenant.logo || "",
      address: (settings.address as string) || "",
      phone: (settings.phone as string) || "",
      taxNumber: (settings.taxNumber as string) || "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const result = await saveCompanyProfile({
        name: data.name,
        domain: data.domain || undefined,
        logo: data.logo || undefined,
        address: data.address || undefined,
        phone: data.phone || undefined,
        taxNumber: data.taxNumber || undefined,
      });

      if (result.success) {
        toast.success("Company profile saved successfully");
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
            <Label htmlFor="name">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Your ISP Name"
              {...register("name", { required: "Company name is required" })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={tenant.slug}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Your subdomain: {tenant.slug}.cloudradius.com
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="domain">Custom Domain</Label>
            <Input
              id="domain"
              placeholder="billing.yourisp.com"
              {...register("domain")}
            />
            <p className="text-xs text-muted-foreground">
              Optional custom domain for your dashboard
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              placeholder="https://example.com/logo.png"
              {...register("logo")}
            />
            <p className="text-xs text-muted-foreground">
              URL to your company logo image
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+91 9876543210"
              {...register("phone")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxNumber">GST / Tax Number</Label>
            <Input
              id="taxNumber"
              placeholder="e.g., 22AAAAA0000A1Z5"
              {...register("taxNumber")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            placeholder="Enter your business address"
            rows={3}
            {...register("address")}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
