import { requireTenantUser } from "@/lib/session";
import { authorize } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { BillingPreferencesForm } from "./billing-form";

export const metadata = { title: "Billing Preferences" };

export default async function BillingPreferencesPage() {
  const user = await requireTenantUser();
  authorize(user.role, "settings", "view");

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId! },
    select: { settings: true },
  });

  const settings = (tenant?.settings as Record<string, unknown>) || {};
  const billingSettings = (settings.billing as Record<string, unknown>) || settings;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing Preferences</h1>
        <p className="text-sm text-muted-foreground">Configure currency, tax, and invoice settings</p>
      </div>
      <BillingPreferencesForm settings={billingSettings} />
    </div>
  );
}
