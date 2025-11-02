import { requireTenantId } from "@/lib/session";
import { planService } from "@/services/plan.service";
import { nasService } from "@/services/nas.service";
import { locationService } from "@/services/location.service";
import { ImportClient } from "./import-client";

export const metadata = {
  title: "Import Subscribers",
};

export default async function ImportPage() {
  const tenantId = await requireTenantId();
  const [plans, nasDevices, locations] = await Promise.all([
    planService.listAll(tenantId),
    nasService.listAll(tenantId),
    locationService.listAll(tenantId),
  ]);

  return (
    <ImportClient
      plans={plans.map((p) => ({ id: p.id, name: p.name }))}
      nasDevices={nasDevices.map((n) => ({ id: n.id, name: n.name }))}
      locations={locations.map((l) => ({ id: l.id, name: l.name }))}
    />
  );
}
