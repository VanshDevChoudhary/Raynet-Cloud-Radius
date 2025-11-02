import { requireTenantId } from "@/lib/session";
import { planService } from "@/services/plan.service";
import { PlanTable } from "./plan-table";
import { serialize } from "@/lib/types";

export const metadata = {
  title: "Plans",
};

export default async function PlansPage() {
  const tenantId = await requireTenantId();
  const result = await planService.list({ tenantId, pageSize: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Plans</h1>
        <p className="text-sm text-muted-foreground">
          Manage bandwidth plans and packages
        </p>
      </div>

      <PlanTable data={serialize(result.data)} />
    </div>
  );
}
