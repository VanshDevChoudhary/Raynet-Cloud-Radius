import { redirect } from "next/navigation";
import { requirePortalSession } from "@/lib/portal-session";
import { portalService } from "@/services/portal.service";
import { PortalProfileClient } from "./portal-profile";

export const metadata = { title: "Profile" };

export default async function PortalProfilePage() {
  const session = await requirePortalSession().catch(() => null);
  if (!session) redirect("/portal/login");

  const profile = await portalService.getSubscriberProfile(
    session.subscriberId,
    session.tenantId
  );

  if (!profile) redirect("/portal/login");

  return <PortalProfileClient profile={JSON.parse(JSON.stringify(profile))} />;
}
