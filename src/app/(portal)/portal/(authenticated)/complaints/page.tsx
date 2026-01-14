import { redirect } from "next/navigation";
import { requirePortalSession } from "@/lib/portal-session";
import { portalService } from "@/services/portal.service";
import { PortalComplaintsClient } from "./portal-complaints";

export const metadata = { title: "Complaints" };

export default async function PortalComplaintsPage() {
  const session = await requirePortalSession().catch(() => null);
  if (!session) redirect("/portal/login");

  const tickets = await portalService.getSubscriberTickets(
    session.subscriberId,
    session.tenantId
  );

  return (
    <PortalComplaintsClient
      tickets={JSON.parse(JSON.stringify(tickets))}
      subscriberId={session.subscriberId}
      tenantId={session.tenantId}
    />
  );
}
