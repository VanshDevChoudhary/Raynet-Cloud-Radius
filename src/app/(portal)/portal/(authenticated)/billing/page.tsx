import { redirect } from "next/navigation";
import { requirePortalSession } from "@/lib/portal-session";
import { portalService } from "@/services/portal.service";
import { PortalBillingClient } from "./portal-billing";

export const metadata = { title: "Billing" };

export default async function PortalBillingPage() {
  const session = await requirePortalSession().catch(() => null);
  if (!session) redirect("/portal/login");

  const invoices = await portalService.getSubscriberInvoices(
    session.subscriberId,
    session.tenantId
  );

  return <PortalBillingClient invoices={JSON.parse(JSON.stringify(invoices))} />;
}
