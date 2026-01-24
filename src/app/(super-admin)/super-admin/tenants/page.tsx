import { tenantService } from "@/services/tenant.service";
import { TenantList } from "./tenant-list";

export const metadata = { title: "Tenant Management" };

export default async function TenantsPage() {
  const tenants = await tenantService.list();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tenants</h1>
          <p className="text-sm text-muted-foreground">Manage ISP operator accounts</p>
        </div>
      </div>
      <TenantList tenants={JSON.parse(JSON.stringify(tenants))} />
    </div>
  );
}
