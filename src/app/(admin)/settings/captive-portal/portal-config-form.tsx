"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { saveCaptivePortalConfig } from "./actions";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface Config {
  id: string;
  isEnabled: boolean;
  logoUrl: string | null;
  backgroundUrl: string | null;
  primaryColor: string;
  welcomeTitle: string;
  welcomeMessage: string | null;
  termsOfService: string | null;
  redirectUrl: string | null;
  enableOtpLogin: boolean;
  enableVoucherLogin: boolean;
  enableUserPassLogin: boolean;
}

interface PortalConfigFormProps {
  config: Config | null;
  tenantSlug: string;
}

export function PortalConfigForm({ config, tenantSlug }: PortalConfigFormProps) {
  const [loading, setLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(config?.isEnabled ?? false);
  const [logoUrl, setLogoUrl] = useState(config?.logoUrl ?? "");
  const [backgroundUrl, setBackgroundUrl] = useState(config?.backgroundUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(config?.primaryColor ?? "#2563eb");
  const [welcomeTitle, setWelcomeTitle] = useState(config?.welcomeTitle ?? "Welcome to WiFi");
  const [welcomeMessage, setWelcomeMessage] = useState(config?.welcomeMessage ?? "");
  const [termsOfService, setTermsOfService] = useState(config?.termsOfService ?? "");
  const [redirectUrl, setRedirectUrl] = useState(config?.redirectUrl ?? "");
  const [enableOtpLogin, setEnableOtpLogin] = useState(config?.enableOtpLogin ?? true);
  const [enableVoucherLogin, setEnableVoucherLogin] = useState(config?.enableVoucherLogin ?? true);
  const [enableUserPassLogin, setEnableUserPassLogin] = useState(config?.enableUserPassLogin ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await saveCaptivePortalConfig({
        isEnabled,
        logoUrl: logoUrl || null,
        backgroundUrl: backgroundUrl || null,
        primaryColor,
        welcomeTitle,
        welcomeMessage: welcomeMessage || null,
        termsOfService: termsOfService || null,
        redirectUrl: redirectUrl || null,
        enableOtpLogin,
        enableVoucherLogin,
        enableUserPassLogin,
      });

      if (result.success) {
        toast.success("Portal settings saved");
      } else {
        toast.error(result.error || "Failed to save");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Enable/Disable */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Portal Status</h3>
            <p className="text-sm text-muted-foreground">
              Enable or disable the captive portal login page
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            {isEnabled && tenantSlug && (
              <Link
                href={`/hotspot/${tenantSlug}`}
                target="_blank"
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                Preview <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Branding</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="backgroundUrl">Background Image URL</Label>
            <Input
              id="backgroundUrl"
              value={backgroundUrl}
              onChange={(e) => setBackgroundUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded border"
              />
              <Input
                id="primaryColor"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="redirectUrl">Post-Login Redirect URL</Label>
            <Input
              id="redirectUrl"
              value={redirectUrl}
              onChange={(e) => setRedirectUrl(e.target.value)}
              placeholder="https://google.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcomeTitle">Welcome Title</Label>
          <Input
            id="welcomeTitle"
            value={welcomeTitle}
            onChange={(e) => setWelcomeTitle(e.target.value)}
            placeholder="Welcome to WiFi"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcomeMessage">Welcome Message</Label>
          <Textarea
            id="welcomeMessage"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Optional message below the title..."
            rows={2}
          />
        </div>
      </div>

      {/* Login Methods */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Login Methods</h3>
        <p className="text-sm text-muted-foreground">
          Choose which authentication methods are available on the portal
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Username & Password</p>
              <p className="text-xs text-muted-foreground">
                Subscribers log in with their RADIUS credentials
              </p>
            </div>
            <Switch checked={enableUserPassLogin} onCheckedChange={setEnableUserPassLogin} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">OTP via SMS</p>
              <p className="text-xs text-muted-foreground">
                One-time password sent to subscriber&apos;s phone
              </p>
            </div>
            <Switch checked={enableOtpLogin} onCheckedChange={setEnableOtpLogin} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Voucher Code</p>
              <p className="text-xs text-muted-foreground">
                Pre-generated voucher codes for instant access
              </p>
            </div>
            <Switch checked={enableVoucherLogin} onCheckedChange={setEnableVoucherLogin} />
          </div>
        </div>
      </div>

      {/* Terms of Service */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h3 className="font-semibold">Terms of Service</h3>
        <p className="text-sm text-muted-foreground">
          If set, users must accept terms before connecting
        </p>

        <Textarea
          value={termsOfService}
          onChange={(e) => setTermsOfService(e.target.value)}
          placeholder="By using this WiFi service, you agree to..."
          rows={4}
        />
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
