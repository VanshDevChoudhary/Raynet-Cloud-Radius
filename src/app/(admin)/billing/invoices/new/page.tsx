import { requireTenantId } from "@/lib/session";
import { subscriberService } from "@/services/subscriber.service";
import { planService } from "@/services/plan.service";
import { prisma } from "@/lib/prisma";
import { InvoiceForm } from "./invoice-form";
import { serialize } from "@/lib/types";

export const metadata = {
  title: "Create Invoice",
};

export default async function NewInvoicePage() {
  const tenantId = await requireTenantId();

  const [subscribers, plans, tenant] = await Promise.all([
    subscriberService.list({ tenantId, pageSize: 1000 }).then((res) => res.data),
    planService.listAll(tenantId),
    prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } }),
  ]);

  const settings = (tenant?.settings as Record<string, unknown>) || {};
  const taxRate = Number(settings.taxRate ?? 0);
  const taxLabel = String(settings.taxLabel ?? "Tax");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create Invoice</h1>
        <p className="text-sm text-muted-foreground">
          Generate a new invoice for a subscriber
        </p>
      </div>

      <InvoiceForm
        subscribers={serialize(subscribers)}
        plans={serialize(plans)}
        taxRate={taxRate}
        taxLabel={taxLabel}
      />
    </div>
  );
}
