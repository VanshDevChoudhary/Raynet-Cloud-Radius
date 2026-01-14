import { redirect } from "next/navigation";
import { requirePortalSession } from "@/lib/portal-session";
import { portalService } from "@/services/portal.service";
import { PortalDashboardClient } from "./portal-dashboard";

export const metadata = { title: "Dashboard" };

export default async function PortalDashboardPage() {
  const session = await requirePortalSession().catch(() => null);
  if (!session) redirect("/portal/login");

  const [profile, usage] = await Promise.all([
    portalService.getSubscriberProfile(session.subscriberId, session.tenantId),
    portalService.getUsageData(session.username, session.tenantSlug),
  ]);

  if (!profile) redirect("/portal/login");

  return (
    <PortalDashboardClient
      profile={JSON.parse(JSON.stringify(profile))}
      usage={usage}
    />
  );
}
