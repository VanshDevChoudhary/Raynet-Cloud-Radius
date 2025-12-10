import { requireTenantId } from "@/lib/session";
import { voucherService } from "@/services/voucher.service";
import { planService } from "@/services/plan.service";
import { VoucherTable } from "./voucher-table";
import { serialize } from "@/lib/types";

export const metadata = {
  title: "Vouchers",
};

export default async function VouchersPage() {
  const tenantId = await requireTenantId();

  const [batchResult, stats, plans] = await Promise.all([
    voucherService.listBatches(tenantId),
    voucherService.getStats(tenantId),
    planService.listAll(tenantId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vouchers</h1>
          <p className="text-sm text-muted-foreground">
            Generate and manage voucher/PIN codes for hotspot access
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Available</p>
          <p className="text-2xl font-bold text-blue-600">{stats.generated}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Sold</p>
          <p className="text-2xl font-bold text-amber-600">{stats.sold}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Redeemed</p>
          <p className="text-2xl font-bold text-green-600">{stats.redeemed}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Expired</p>
          <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
        </div>
      </div>

      <VoucherTable
        batches={serialize(batchResult.data)}
        plans={serialize(plans)}
        meta={batchResult.meta}
      />
    </div>
  );
}
