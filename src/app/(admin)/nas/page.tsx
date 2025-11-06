import { requireTenantId } from "@/lib/session";
import { nasService } from "@/services/nas.service";
import { locationService } from "@/services/location.service";
import { NasTable } from "./nas-table";

export const metadata = {
  title: "NAS Devices",
};

export default async function NasDevicesPage() {
  const tenantId = await requireTenantId();
  const [nasResult, locations] = await Promise.all([
    nasService.list({ tenantId, pageSize: 100 }),
    locationService.listAll(tenantId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">NAS Devices</h1>
        <p className="text-sm text-muted-foreground">
          Manage your MikroTik routers and NAS devices
        </p>
      </div>

      <NasTable data={nasResult.data} locations={locations} />
    </div>
  );
}
