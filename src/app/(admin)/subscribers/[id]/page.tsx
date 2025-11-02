import { notFound } from "next/navigation";
import { requireTenantUser } from "@/lib/session";
import { subscriberService } from "@/services/subscriber.service";
import { billingService } from "@/services/billing.service";
import { paymentService } from "@/services/payment.service";
import { ticketService } from "@/services/ticket.service";
import { radiusService } from "@/services/radius.service";
import { SubscriberProfile } from "./subscriber-profile";
import { serialize } from "@/lib/types";

export const metadata = {
  title: "Subscriber Profile",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SubscriberProfilePage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireTenantUser();
  const tenantId = user.tenantId!;
  const tenantSlug = user.tenantSlug!;

  const subscriber = await subscriberService.getById(tenantId, id);

  if (!subscriber) {
    notFound();
  }

  // Fetch billing, session, and ticket data in parallel
  const [invoicesResult, paymentsResult, ticketsResult, sessionsResult] =
    await Promise.all([
      billingService.list({
        tenantId,
        subscriberId: id,
        page: 1,
        pageSize: 20,
      }),
      paymentService.list({
        tenantId,
        subscriberId: id,
        page: 1,
        pageSize: 20,
      }),
      ticketService.list(tenantId, {
        subscriberId: id,
        page: 1,
        pageSize: 20,
      }),
      radiusService.getSessionHistory({
        tenantSlug,
        subscriberUsername: subscriber.username,
        page: 1,
        pageSize: 20,
      }),
    ]);

  return (
    <SubscriberProfile
      subscriber={serialize(subscriber)}
      invoices={serialize(invoicesResult.data)}
      payments={serialize(paymentsResult.data)}
      tickets={serialize(ticketsResult.data)}
      sessions={serialize(sessionsResult.data)}
    />
  );
}
