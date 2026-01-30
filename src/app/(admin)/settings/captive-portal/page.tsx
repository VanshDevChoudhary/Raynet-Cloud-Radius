import { requireTenantId } from "@/lib/session";
import { captivePortalService } from "@/services/captive-portal.service";
import { prisma } from "@/lib/prisma";
import { PortalConfigForm } from "./portal-config-form";

export const metadata = {
  title: "Captive Portal Settings",
};

export default async function CaptivePortalSettingsPage() {
  const tenantId = await requireTenantId();

  const [config, tenant] = await Promise.all([
    captivePortalService.getConfig(tenantId),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Captive Portal Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your hotspot login page for WiFi subscribers
        </p>
      </div>

      {tenant && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            Portal URL
          </p>
          <p className="mt-1 font-mono text-sm text-blue-600 dark:text-blue-300">
            {typeof window !== "undefined"
              ? `${window.location.origin}/hotspot/${tenant.slug}`
              : `/hotspot/${tenant.slug}`}
          </p>
          <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            Configure your MikroTik hotspot to redirect to this URL for captive portal login.
          </p>
        </div>
      )}

      <PortalConfigForm config={config} tenantSlug={tenant?.slug || ""} />
    </div>
  );
}
