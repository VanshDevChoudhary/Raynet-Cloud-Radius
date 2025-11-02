import { requireTenantId } from "@/lib/session";
import { subscriberService } from "@/services/subscriber.service";
import { ExportClient } from "./export-client";

export const metadata = {
  title: "Export Subscribers",
};

export default async function ExportPage() {
  const tenantId = await requireTenantId();
  const subscribers = await subscriberService.exportAll(tenantId);

  // Transform to flat CSV-friendly shape
  const rows = subscribers.map((s) => ({
    name: s.name,
    phone: s.phone,
    email: s.email ?? "",
    username: s.username,
    status: s.status,
    connectionType: s.connectionType,
    subscriberType: s.subscriberType,
    plan: s.plan?.name ?? "",
    nasDevice: s.nasDevice?.name ?? "",
    location: s.location?.name ?? "",
    macAddress: s.macAddress ?? "",
    ipAddress: s.ipAddress ?? "",
    address: s.address ?? "",
    expiryDate: s.expiryDate ? new Date(s.expiryDate).toISOString().split("T")[0] : "",
    createdAt: new Date(s.createdAt).toISOString().split("T")[0],
  }));

  return <ExportClient data={rows} />;
}
